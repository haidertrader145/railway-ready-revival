// Pure helpers and Roman Urdu message builders for the Amir FX Community bot.
// No server-only imports here so the rules stay unit-testable.

export type Platform = "quotex" | "pocket_option";

export interface ServiceInfo {
  service_key: string;
  title: string;
  min_balance: number;
  invite_link: string | null;
  sort: number;
}

export interface BotSettings {
  welcome_text: string;
  welcome_media_url: string;
  quotex_reg_link: string;
  pocket_reg_link: string;
  youtube_link: string;
  onetoone_timings: string;
  autodelete_minutes: number;
  link_delete_minutes: number;
}

export const DEFAULT_SETTINGS: BotSettings = {
  welcome_text: "👋 <b>Amir FX Community</b> mein khush aamdeed!",
  welcome_media_url: "",
  quotex_reg_link: "",
  pocket_reg_link: "",
  youtube_link: "",
  onetoone_timings:
    "One-to-One sessions weekly schedule par hote hain. Timing confirm karne ke liye admin se rabta karein.",
  autodelete_minutes: 10,
  link_delete_minutes: 60,
};

export interface InlineButton {
  text: string;
  callback_data: string;
}
export interface InlineKeyboard {
  inline_keyboard: InlineButton[][];
}

export function shortfall(balance: number, min: number): number {
  return Math.max(0, Math.round((min - balance) * 100) / 100);
}

export function isEligible(balance: number, min: number): boolean {
  return balance >= min;
}

export function money(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function platformName(platform: string | null): string {
  return platform === "pocket_option" ? "Pocket Option" : "Quotex";
}

// ---------- Keyboards ----------

export function mainMenuKeyboard(verified: boolean): InlineKeyboard {
  const rows: InlineButton[][] = [
    [{ text: "📈 Quotex Trading", callback_data: "m:quotex" }],
    [{ text: "📱 Pocket Option Trading", callback_data: "m:pocket" }],
    [{ text: "🎓 Trading Learning (Free)", callback_data: "m:learn" }],
  ];
  if (verified) rows.push([{ text: "🎯 Meri Services", callback_data: "m:services" }]);
  return { inline_keyboard: rows };
}

export function navRow(): InlineButton[] {
  return [
    { text: "◀️ Back", callback_data: "nav:back" },
    { text: "🏠 Main Menu", callback_data: "nav:menu" },
  ];
}

export function servicesKeyboard(services: ServiceInfo[]): InlineKeyboard {
  const emoji: Record<string, string> = {
    trading_series: "1️⃣",
    vip_sessions: "2️⃣",
    ai_license: "3️⃣",
    one_to_one: "4️⃣",
  };
  const rows = [...services]
    .sort((a, b) => a.sort - b.sort)
    .map((s) => [
      {
        text: `${emoji[s.service_key] ?? "🔹"} ${s.title} — ${money(s.min_balance)}`,
        callback_data: `svc:${s.service_key}`,
      },
    ]);
  rows.push(navRow());
  return { inline_keyboard: rows };
}

// ---------- Texts (Roman Urdu) ----------

export function mainMenuText(settings: BotSettings): string {
  const head = settings.welcome_text || DEFAULT_SETTINGS.welcome_text;
  return `${head}\n\nNeeche di gayi koi bhi service select karein 👇\n\n💡 Learn Smart • Trade Responsibly • Grow Your Skills`;
}

export function askTraderIdText(platform: Platform, settings: BotSettings): string {
  const name = platformName(platform);
  const link = platform === "quotex" ? settings.quotex_reg_link : settings.pocket_reg_link;
  let t = `📝 Meharbani kar ke apni <b>${name} Trader ID</b> yahan bhejein, taake main aap ka account verify kar sakoon.\n\n`;
  if (link) {
    t += `⚠️ Account hamare registration link se hona chahiye:\n${link}\n\n`;
  }
  if (platform === "pocket_option") {
    t += `ℹ️ Pocket Option accounts manual verify kiye jate hain — team verification ke baad aap ko update kare gi.\n\n`;
  }
  t += `🆔 Trader ID sirf numbers/alphanumeric hoti hai — spaces ya symbols na bhejein.`;
  return t;
}

export function verifyingText(traderId: string): string {
  return `⏳ Aap ki Trader ID <b>${traderId}</b> verify ki ja rahi hai…\n\nMomkin hai ek minute le — result milne par main foran message karoon ga.`;
}

export function invalidIdText(): string {
  return "⚠️ Yeh koi sahi Trader ID nahi lagti. Meharbani kar ke sirf apni numeric/alphanumeric Trader ID bhejein (spaces ya symbols ke baghair).";
}

export function notRegisteredText(traderId: string, platform: Platform, settings: BotSettings): string {
  const name = platformName(platform);
  const link = platform === "quotex" ? settings.quotex_reg_link : settings.pocket_reg_link;
  let t = `❌ Aap ki Trader ID <b>${traderId}</b> hamare link se <b>registered nahi</b> hai.\n\n✅ Pehle hamare registration link se account banayein, phir apni Trader ID dobara bhejein.`;
  if (link) t += `\n\n🔗 Registration link:\n${link}`;
  return t;
}

export function unknownReplyText(traderId: string): string {
  return `⚠️ Trader ID <b>${traderId}</b> ki verification confirm nahi ho saki.\n\nMeharbani kar ke thori dair baad apni Trader ID dobara bhejein.`;
}

export function verifiedText(traderId: string, balance: number): string {
  return `✅ <b>Verification Successful!</b>\n\n🆔 Trader ID: <b>${traderId}</b>\n💰 Available Balance: <b>${money(balance)}</b>\n\nAb neeche se apni service select karein 👇`;
}

export function servicesMenuText(): string {
  return "🎯 <b>Meri Services</b>\n\nApni service select karein 👇";
}

export function insufficientText(service: ServiceInfo, balance: number): string {
  return (
    `🎯 <b>${service.title}</b>\n\n` +
    `💰 Aap ka current balance: <b>${money(balance)}</b>\n` +
    `📌 Required balance: <b>${money(service.min_balance)}</b>\n\n` +
    `⚠️ Aap ka current balance eligible nahi hai.\n` +
    `👉 Deposit <b>${money(shortfall(balance, service.min_balance))}</b> karein taake aap eligible ho jayein, phir apni Trader ID dobara bhejein.`
  );
}

export function depositCheckInsufficientText(service: ServiceInfo, balance: number): string {
  return (
    `💰 Aap ka current balance: <b>${money(balance)}</b>\n` +
    `📌 Required: <b>${money(service.min_balance)}</b>\n\n` +
    `⚠️ Aap ka current balance abhi eligible nahi hai.\n` +
    `👉 Deposit <b>${money(shortfall(balance, service.min_balance))}</b> karein, phir apni Trader ID dobara bhejein taake main balance verify kar sakoon.`
  );
}

export function linkText(service: ServiceInfo): string {
  return (
    `🔗 <b>${service.title} — Group Access</b>\n\n` +
    `${service.invite_link ?? ""}\n\n` +
    `⏳ Yeh link thori dair baad automatically delete ho jaye ga — join karne ke baad dobara ki zaroorat nahi.`
  );
}

export function eligibleText(service: ServiceInfo, balance: number): string {
  return `🎉 <b>Mubarak ho!</b> Aap ka balance <b>${money(balance)}</b> hai — aap <b>${service.title}</b> ke liye eligible hain.`;
}

export function licenseText(key: string): string {
  return (
    `🎉 <b>Mubarak ho!</b> Aap ka balance eligible hai.\n\n` +
    `🔑 Aap ki AI Bot License Key:\n<code>${key}</code>\n\n` +
    `Yeh key sirf aap ke account ke liye hai — meharbani kar ke isay mehfooz rakhein.`
  );
}

export function noKeysText(): string {
  return "✅ Aap eligible hain! Lekin abhi license keys available nahi hain — team ko khabar kar di gayi hai aur aap ki key jald bhej di jaye gi.";
}

export function oneToOneText(settings: BotSettings): string {
  return `🎉 <b>Mubarak ho!</b> Aap One-to-One Session ke liye eligible hain.\n\n📅 Available Session Timings:\n${settings.onetoone_timings}`;
}

export function learningText(settings: BotSettings): string {
  let t = "🎓 <b>Trading Learning — 100% Free</b>\n\n";
  if (settings.youtube_link) {
    t += `📺 YouTube Premium Classes Playlist:\n${settings.youtube_link}\n\n`;
  }
  t += "💡 Learn Smart • Trade Responsibly • Grow Your Skills";
  return t;
}

export function alreadyVerifiedKeyText(traderId: string, key: string): string {
  return (
    `✅ Aap ki AI Bot License Key pehle se issue ho chuki hai.\n\n` +
    `🆔 Trader ID: <b>${traderId}</b>\n` +
    `🔑 License Key:\n<code>${key}</code>`
  );
}

export function pendingRequestText(traderId: string): string {
  return `⏳ Trader ID <b>${traderId}</b> ki verification pehle se jaari hai. Meharbani kar ke result ka intezar karein.`;
}
