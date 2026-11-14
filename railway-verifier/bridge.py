"""Always-on Telethon verifier. TG_SESSION takes priority over saved app login."""
import asyncio
import os
import re
import time

import requests
from telethon import TelegramClient
from telethon.errors import FloodWaitError, SessionPasswordNeededError
from telethon.sessions import StringSession

APP_BASE = os.getenv("APP_BASE", "https://railway-ready-revival.lovable.app").rstrip("/")


def classify(text, trader_id):
    return bool(re.search(rf"trader\s*#\s*{re.escape(str(trader_id))}\b", text.lower()))


def api(method, path, body=None):
    secret = os.getenv("VERIFIER_SECRET")
    if not secret:
        raise RuntimeError("Missing VERIFIER_SECRET")
    response = requests.request(method, f"{APP_BASE}/api/public/telegram/{path}",
                                headers={"X-Verifier-Secret": secret}, json=body, timeout=30)
    response.raise_for_status()
    return response.json()


async def state():
    return await asyncio.to_thread(api, "GET", "bridge")


async def report(**body):
    return await asyncio.to_thread(api, "POST", "bridge", body)


def session_value(cfg):
    return os.getenv("TG_SESSION", "").strip() or cfg.get("session_string") or ""


def config_values(cfg):
    return {key: os.getenv(env) or cfg.get(key) for key, env in {
        "api_id": "TG_API_ID", "api_hash": "TG_API_HASH", "phone": "TG_PHONE",
        "password": "TG_2FA_PASSWORD", "affiliate_bot": "AFFILIATE_BOT",
    }.items()}


async def login(cfg):
    if not cfg.get("phone"):
        raise RuntimeError("TG_PHONE is needed only for initial login")
    client = TelegramClient(StringSession(), int(cfg["api_id"]), cfg["api_hash"])
    await client.connect()
    try:
        await report(status="waiting_code", clear_code=True)
        sent = await client.send_code_request(cfg["phone"])
        print("Telegram accepted the login request. Check Telegram on your logged-in devices; SMS is not guaranteed.", flush=True)
        deadline = time.monotonic() + 300
        while time.monotonic() < deadline:
            await asyncio.sleep(3)
            code = (await state()).get("login_code")
            await report(status="waiting_code")
            if not code:
                continue
            try:
                await client.sign_in(cfg["phone"], code, phone_code_hash=sent.phone_code_hash)
            except SessionPasswordNeededError:
                if not cfg.get("password"):
                    raise RuntimeError("Telegram two-step password is required")
                await client.sign_in(password=cfg["password"])
            if not await client.is_user_authorized():
                raise RuntimeError("Telegram did not authorize this session")
            await report(status="running", session_string=client.session.save(), clear_code=True)
            return client
        raise RuntimeError("Initial login timed out; generate TG_SESSION locally instead")
    except BaseException:
        await client.disconnect()
        raise


async def connect_client(raw_cfg):
    cfg = config_values(raw_cfg)
    saved = session_value(raw_cfg)
    if not saved:
        return await login(cfg)
    # Never request fresh codes behind the owner's back for an invalid saved session.
    client = TelegramClient(StringSession(saved), int(cfg["api_id"]), cfg["api_hash"],
                            auto_reconnect=True, connection_retries=5, retry_delay=3)
    await client.connect()
    try:
        if not await client.is_user_authorized():
            raise RuntimeError("Saved Telegram session was revoked; replace TG_SESSION")
        await report(status="running", session_string=client.session.save(), clear_code=True)
        return client
    except BaseException:
        await client.disconnect()
        raise


async def check_request(client, bot, req):
    tid = str(req["trader_id"])
    # Use the outgoing message as the cursor so an earlier reply is never selected.
    sent = await client.send_message(bot, tid)
    reply = ""
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        await report(status="running")
        msgs = await client.get_messages(bot, limit=10, min_id=sent.id)
        incoming = [m for m in msgs if not m.out and m.message]
        if incoming:
            await asyncio.sleep(2)
            msgs = await client.get_messages(bot, limit=10, min_id=sent.id)
            reply = "\n".join(m.message for m in reversed(msgs) if not m.out and m.message)
            break
        await asyncio.sleep(2)
    # A timeout/unclear answer is an error, never approval; resolve it instead of looping on the same ID.
    await asyncio.to_thread(api, "POST", "verify-result", {
        "request_id": req["id"], "verified": classify(reply, tid), "affiliate_reply": reply[:2000],
    })
    print("Verification result delivered." if reply else "No affiliate reply; request marked unresolved/error by app.", flush=True)


async def run_connected(client, cfg):
    bot = config_values(cfg)["affiliate_bot"]
    print("Running with a saved Telegram session. Checking IDs one at a time.", flush=True)
    while True:
        current = await state()
        if not os.getenv("TG_SESSION", "").strip() and not current.get("session_string"):
            await client.log_out()
            raise RuntimeError("Logged out from the admin page")
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            raise RuntimeError("Telegram session no longer authorized")
        await report(status="running")
        pending = await asyncio.to_thread(api, "GET", "pending-requests")
        for req in pending.get("requests", []):
            await check_request(client, bot, req)
        await asyncio.sleep(5)


async def main():
    delay = 5
    while True:
        client = None
        try:
            cfg = await state()
            values = config_values(cfg)
            if not all(values.get(k) for k in ("api_id", "api_hash", "affiliate_bot")):
                await report(status="config_missing")
                print("Missing Telegram API details or affiliate bot. Retrying in 30 seconds.", flush=True)
                await asyncio.sleep(30)
                continue
            client = await connect_client(cfg)
            delay = 5
            await run_connected(client, cfg)
        except FloodWaitError as error:
            delay = max(5, error.seconds)
            print("Telegram requested a cooldown; waiting before reconnecting.", flush=True)
        except Exception as error:
            # Do not print exception bodies: they may contain credentials, session or request details.
            print(f"Helper paused ({type(error).__name__}). Check variables, saved session and app availability.", flush=True)
            try:
                await report(status="login_failed" if client is None else "offline")
            except Exception:
                pass
            delay = min(max(delay * 2, 30), 300)
        finally:
            if client is not None:
                await client.disconnect()
        await asyncio.sleep(delay)


if __name__ == "__main__":
    asyncio.run(main())
