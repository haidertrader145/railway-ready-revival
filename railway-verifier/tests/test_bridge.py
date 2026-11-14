import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bridge


class SessionTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"TG_SESSION": "saved-session"}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)
        self.cfg = {"api_id": 12345, "api_hash": "test-hash", "affiliate_bot": "partner", "session_string": "old-session"}

    def test_variable_survives_empty_app_state(self):
        self.assertEqual(bridge.session_value({"session_string": None}), "saved-session")
        self.assertEqual(bridge.session_value(self.cfg), "saved-session")

    def test_legacy_saved_session(self):
        with patch.dict(os.environ, {"TG_SESSION": ""}):
            self.assertEqual(bridge.session_value(self.cfg), "old-session")

    async def test_authorized_restart_never_sends_code(self):
        client = MagicMock()
        client.connect = AsyncMock()
        client.disconnect = AsyncMock()
        client.is_user_authorized = AsyncMock(return_value=True)
        client.send_code_request = AsyncMock()
        client.session.save.return_value = "saved-session"
        with patch.object(bridge, "StringSession"), patch.object(bridge, "TelegramClient", return_value=client), patch.object(bridge, "report", new_callable=AsyncMock) as report:
            result = await bridge.connect_client(self.cfg)
        self.assertIs(result, client)
        client.send_code_request.assert_not_awaited()
        report.assert_awaited_once_with(status="running", session_string="saved-session", clear_code=True)

    async def test_revoked_session_does_not_request_code(self):
        client = MagicMock()
        client.connect = AsyncMock()
        client.disconnect = AsyncMock()
        client.is_user_authorized = AsyncMock(return_value=False)
        with patch.object(bridge, "StringSession"), patch.object(bridge, "TelegramClient", return_value=client), patch.object(bridge, "login", new_callable=AsyncMock) as login:
            with self.assertRaisesRegex(RuntimeError, "revoked"):
                await bridge.connect_client(self.cfg)
        login.assert_not_awaited()
        client.disconnect.assert_awaited_once()

    async def test_real_reply_sent_back_to_app(self):
        client = MagicMock()
        client.send_message = AsyncMock(return_value=MagicMock(id=20))
        msg = MagicMock(out=False, message="Trader # 12345678\nBalance: 50")
        client.get_messages = AsyncMock(return_value=[msg])
        with patch.object(bridge, "report", new_callable=AsyncMock), patch.object(bridge.asyncio, "sleep", new_callable=AsyncMock), patch.object(bridge, "api", return_value={"ok": True}) as api:
            await bridge.check_request(client, "partner", {"id": "request-1", "trader_id": "12345678"})
        self.assertEqual(api.call_args.args[2], {"request_id": "request-1", "verified": True, "affiliate_reply": msg.message})
        self.assertEqual(client.get_messages.call_args.kwargs["min_id"], 20)

    async def test_timeout_resolves_instead_of_retrying_forever(self):
        client = MagicMock()
        client.send_message = AsyncMock(return_value=MagicMock(id=20))
        with patch.object(bridge.time, "monotonic", side_effect=[0, 61]), patch.object(bridge, "api", return_value={"ok": True}) as api:
            await bridge.check_request(client, "partner", {"id": "request-2", "trader_id": "12345678"})
        self.assertEqual(api.call_args.args[2], {"request_id": "request-2", "verified": False, "affiliate_reply": ""})
        client.send_message.assert_awaited_once()

    async def test_failed_delivery_is_not_swallowed(self):
        client = MagicMock()
        client.send_message = AsyncMock(return_value=MagicMock(id=20))
        with patch.object(bridge.time, "monotonic", side_effect=[0, 61]), patch.object(bridge, "api", side_effect=RuntimeError("Unavailable")):
            with self.assertRaises(RuntimeError):
                await bridge.check_request(client, "partner", {"id": "request-3", "trader_id": "12345678"})

    async def test_checks_are_sequential(self):
        client = MagicMock()
        client.is_connected.return_value = True
        client.is_user_authorized = AsyncMock(return_value=True)
        order = []
        async def check(client, bot, req):
            order.append(req["id"])
        async def stop(_):
            raise asyncio.CancelledError()
        with patch.object(bridge, "state", new_callable=AsyncMock, return_value={}), patch.object(bridge, "report", new_callable=AsyncMock), patch.object(bridge, "api", return_value={"requests": [{"id": "first"}, {"id": "second"}]}), patch.object(bridge, "check_request", side_effect=check), patch.object(bridge.asyncio, "sleep", side_effect=stop):
            with self.assertRaises(asyncio.CancelledError):
                await bridge.run_connected(client, self.cfg)
        self.assertEqual(order, ["first", "second"])


if __name__ == "__main__":
    unittest.main()