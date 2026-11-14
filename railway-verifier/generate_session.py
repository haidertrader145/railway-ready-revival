"""Run on your own computer. Never share the generated session in chat."""
import asyncio
import getpass
import os
from pathlib import Path

from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError
from telethon.sessions import StringSession


async def main():
    api_id = int(input("Telegram API ID: ").strip())
    api_hash = getpass.getpass("Telegram API hash (hidden): ").strip()
    phone = getpass.getpass("Telegram phone with country code (hidden): ").strip()
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()
    try:
        sent = await client.send_code_request(phone)
        print("Check the Telegram service chat on an already logged-in device. Delivery is controlled by Telegram.")
        code = getpass.getpass("Telegram login code (hidden): ").strip()
        try:
            await client.sign_in(phone, code, phone_code_hash=sent.phone_code_hash)
        except SessionPasswordNeededError:
            await client.sign_in(password=getpass.getpass("Telegram two-step password (hidden): "))
        if not await client.is_user_authorized():
            raise RuntimeError("Telegram login was not authorized")
        path = Path("tg-session.secret")
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as file:
            file.write(client.session.save())
        print("Saved tg-session.secret locally. Paste its contents into Railway's TG_SESSION variable, then delete the file.")
    finally:
        await client.disconnect()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as error:
        print(f"Session generation failed ({type(error).__name__}). Check your Telegram details and try again.")
        raise SystemExit(1)
