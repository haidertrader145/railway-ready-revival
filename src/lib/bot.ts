// Pure helpers and Roman Urdu message builders for the Amir FX Community bot.
// No server-only imports here so the rules stay unit-testable.

// Quotex is the only supported platform — Pocket Option was removed.
export type Platform = "quotex";

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
  youtube_link: string;
  onetoone_timings: string;
  onetoone_handle: string;
  autodelete_minutes: number;
  link_delete_minutes: number;
}

export const DEFAULT_SETTINGS: BotSettings = {
  welcome_text:
    "🌟 <b>WELCOME TO AMIR FX COMMUNITY</b> 🌟\n\n" +
    "Assalam-o-Alaikum! ❤️\n\n" +
    "Amir FX Community mein aap ko dil se khush aamdeed!\n\n" +
    "Hamari community ka maqsad aap ko trading seekhne, apni trading skills improve karne aur trading se related services hasil karne mein guide karna hai.\n\n" +
    "Yahan aap ko Trading Series, VIP Trading Sessions, AI Trading Bot aur One-to-One Sessions jaisi services mil sakti hain.\n\n" +
    "👇 Aap kis cheez mein interested hain?",
  welcome_media_url: "",
  quotex_reg_link: "",
  youtube_link: "",
  onetoone_timings:
    "One-to-One sessions weekly schedule par hote hain. Timing confirm karne ke liye admin se rabta karein.",
  onetoone_handle: "@amirtrader540",
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

/** Trader IDs are digits only, 8–9 numbers long. Anything shorter or longer —
 * or containing letters/symbols — is rejected. */
export function isValidTraderId(id: string): boolean {
  return /^\d{8,9}$/.test(id.trim());
}

/** Classifies a digits-only input that failed the length rule, so the bot can
 * tell "too short" from "too long" instead of one generic error. */
export function traderIdLengthIssue(id: string): "short" | "long" | null {
  const digits = id.trim().replace(/\D/g, "");
  if (!/^\d+$/.test(id.trim()) || digits.length === 0) return null;
  if (digits.length >= 8 && digits.length <= 9) return null;
  return digits.length < 8 ? "short" : "long";
}

/** Pending verifications older than this are expired so nothing gets stuck. */
export const PENDING_TTL_MINUTES = 10;

/** Every single bot message carries the registration link — for verified and
 * unverified users alike — unless the message already contains it. */
export function appendRegLink(text: string, link: string, _verified: boolean): string {
  if (!link || text.includes(link)) return text;
  return `${text}\n\n🔗 Registration link:\n${link}`;
}

/** Caption for the welcome media (video / voice note / audio): the media itself
 * has no text, so the registration link rides along as the caption for every
 * user, verified or not. */
export function welcomeMediaCaption(link: string, _verified: boolean): string | undefined {
  if (!link) return undefined;
  return `🔗 Registration link:\n${link}`;
}

export function money(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function platformName(_platform?: string | null): string {
  return "Quotex";
}

// ---------- Keyboards ----------

export function mainMenuKeyboard(verified: boolean): InlineKeyboard {
  const rows: InlineButton[][] = [
    [{ text: "📈 Quotex Trading", callback_data: "m:quotex" }],
    [{ text: "📚 Trading Learning – Free Classes", callback_data: "m:learn" }],
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
    trading_series: "🚀",
    vip_sessions: "👑",
    ai_license: "🤖",
    one_to_one: "💎",
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
  return `${head}\n\n💬 Koi sawal ho to seedha likh kar bhejein — account banana, deposit ya services ke baare mein main foran jawab doon ga.`;
}

export function askTraderIdText(_platform: Platform, settings: BotSettings): string {
  const link = settings.quotex_reg_link;
  let t =
    `📈 <b>WELCOME TO AMIR FX QUOTEX COMMUNITY</b>\n\n` +
    `Assalam-o-Alaikum Dear Trader! ❤️\n\n` +
    `Hamari Quotex Trading Services join karne ke liye sab se pehle aap ka account hamare Official Community Link ke through registered aur verified hona zaroori hai.\n\n` +
    `<b>Account Verify Karne Ka Tarika:</b>\n` +
    `1️⃣ Hamare Official Quotex Community Link par click karein.\n` +
    `2️⃣ Apna Quotex Trading Account create karein.\n` +
    `3️⃣ Apni Quotex Trader ID hamein send karein.\n` +
    `4️⃣ Hamara system aap ki Trader ID verify karega.\n` +
    `5️⃣ Verification successful hone ke baad aap services select kar sakenge.\n\n`;
  if (link) {
    t += `🔗 Official Quotex Community Link:\n${link}\n\n`;
  }
  t +=
    `📩 Please Send Your Quotex Trader ID.\n\n` +
    `🆔 Trader ID sirf <b>digits (numbers)</b> mein <b>8 se 9 numbers</b> ki hoti hai — letters ya words accept nahi hote.`;
  return t;
}

export function verifyingText(traderId: string): string {
  return `⏳ Aap ki Trader ID <b>${traderId}</b> verify ki ja rahi hai…\n\nMomkin hai ek minute le — result milne par main foran message karoon ga.`;
}

export function invalidIdText(): string {
  return "⚠️ Yeh koi sahi Trader ID nahi lagti. Trader ID sirf <b>digits</b> mein <b>8 se 9 numbers</b> ki hoti hai — words ya letters accept nahi hote. Meharbani kar ke apni numeric Trader ID bhejein (misal: 12345678).";
}

/** Sent when the input is all digits but shorter than 8 numbers. */
export function shortIdText(): string {
  return "⚠️ Yeh Trader ID bohat <b>chhoti</b> hai. Sahi Trader ID <b>8 se 9 numbers</b> ki hoti hai — meharbani kar ke apni mukammal numeric Trader ID dobara bhejein (misal: 12345678).";
}

/** Sent when the input is all digits but longer than 9 numbers. */
export function longIdText(): string {
  return "⚠️ Bohat <b>lambi Trader ID</b> — Trader ID sirf <b>8 se 9 numbers</b> ki hoti hai. Meharbani kar ke apni Quotex app se sahi numeric Trader ID check kar ke dobara bhejein.";
}

/** Once a trader ID is verified it is locked: balance checks must use that
 * same verified ID, so the deposit lands in the account that was checked. */
export function lockedIdText(verifiedId: string, attemptedId: string): string {
  return (
    `🔒 Aap ki Trader ID <b>${verifiedId}</b> pehle se <b>verified</b> hai — yeh ID aap ke liye <b>lock</b> ho gayi hai.\n\n` +
    `✅ Access ke liye aap ko isi verified ID <b>${verifiedId}</b> mein deposit karna hoga, phir usi ID ko dobara bhejein.\n\n` +
    `🆔 Aap ne <b>${attemptedId}</b> bheji hai — dusri ID yahan kaam nahi kare gi. Agar sach mein ID badalni hai to admin se purani verification remove karwani hogi.`
  );
}

export function notRegisteredText(traderId: string, _platform: Platform, settings: BotSettings): string {
  const link = settings.quotex_reg_link;
  let t =
    `❌ <b>TRADER ID VERIFICATION FAILED</b>\n\n` +
    `Dear Trader!\n\n` +
    `Aap ki provide ki gayi Quotex Trader ID <b>${traderId}</b> verify nahi ho saki.\n\n` +
    `Kindly apni correct Trader ID dobara send karein.\n\n` +
    `Agar aap ne abhi tak hamare Official Community Link se account create nahi kiya, to neeche diye gaye link se register karein.\n\n`;
  if (link) t += `🔗 Official Quotex Community Link:\n${link}\n\n`;
  t += `📩 Please Send Your Correct Trader ID.`;
  return t;
}

export function unknownReplyText(traderId: string): string {
  return `⚠️ Trader ID <b>${traderId}</b> ki verification confirm nahi ho saki.\n\nMeharbani kar ke thori dair baad apni Trader ID dobara bhejein.`;
}

export function verifiedText(traderId: string, balance: number): string {
  return (
    `🎉 <b>CONGRATULATIONS! ACCOUNT VERIFIED</b> ✅\n\n` +
    `Mubarak Ho Dear Trader! ❤️\n\n` +
    `Aap ka Quotex Trading Account successfully Amir FX Community ke saath verify ho chuka hai.\n\n` +
    `🆔 Trader ID: <b>${traderId}</b>\n💰 Available Balance: <b>${money(balance)}</b>\n\n` +
    `<b>Available Services:</b>\n\n` +
    `🚀 1. Quotex Trading Series\nStarting balance: $100 | Target: $500 | Duration: 2 Days\n\n` +
    `👑 2. Quotex VIP Trading Sessions\nMinimum account balance: $50\n\n` +
    `🤖 3. Quotex AI Bot License Key\nMinimum account balance: $50\n\n` +
    `💎 4. One-to-One Trading Session\nMinimum account balance: $300 | 50/50 profit sharing\n\n` +
    `Ab aap hamari available trading services select kar sakte hain 👇`
  );
}

export function servicesMenuText(): string {
  return "🎯 <b>Meri Services</b>\n\nApni service select karein 👇";
}

/** Full service description shown when a verified user taps a service. */
export function serviceIntroText(service: ServiceInfo): string {
  const min = money(service.min_balance);
  switch (service.service_key) {
    case "trading_series":
      return (
        `🚀 <b>AMIR FX QUOTEX TRADING SERIES</b>\n\n💰 <b>$100 TO $500 TRADING SERIES</b>\n\n` +
        `Starting Balance: $100\nTarget Balance: $500\nDuration: 2 Days\nPlatform: Quotex\n\n` +
        `Join karne ke liye minimum ${min} account balance zaroori hai.\n\n` +
        `Apni Trader ID send karein taake account aur balance verify kiya ja sake.`
      );
    case "vip_sessions":
      return (
        `👑 <b>AMIR FX QUOTEX VIP TRADING SESSIONS</b>\n\nVIP Sessions join karne ke liye:\n\n` +
        `Minimum Balance: ${min}\nPlatform: Quotex\nService: VIP Trading Sessions\n\n` +
        `Apni Trader ID send karein. Verification successful hone ke baad VIP Group access provide kiya jayega.`
      );
    case "ai_license":
      return (
        `🤖 <b>AMIR FX QUOTEX AI TRADING BOT</b>\n\n🔑 <b>GET YOUR BOT LICENSE KEY</b>\n\nRequirements:\n\n` +
        `Service: AI Trading Bot\nMinimum Balance: ${min}\nPlatform: Quotex\n\n` +
        `Apni Trader ID send karein. Account aur balance verification successful hone ke baad aap ko AI Bot License Key provide ki jayegi.`
      );
    case "one_to_one":
      return (
        `💎 <b>AMIR FX PREMIUM ONE-TO-ONE TRADING SESSION</b>\n\n👑 <b>PERSONAL TRADING & ACCOUNT MANAGEMENT</b>\n\nRequirements:\n\n` +
        `Minimum Account Balance: ${min}\nProfit Sharing: 50% Amir FX / 50% Client\nPlatform: Quotex\nSession Timing: After Account Verification\n\n` +
        `<b>Important Rules:</b>\n` +
        `• Trading capital aap ke apne Quotex account mein rahega.\n` +
        `• Kisi admin ya third party ko investment transfer nahi karni.\n` +
        `• Profit sharing actual realized net profit par applicable hogi.\n` +
        `• Session booking successful verification ke baad hogi.\n\n` +
        `Apni Trader ID send karein aur verification complete karein.`
      );
    default:
      return `🎯 <b>${service.title}</b>\n📌 Required balance: <b>${min}</b>\n\nApni Trader ID send karein.`;
  }
}

/** Service-specific "balance too low" message from the owner's script. */
export function insufficientText(service: ServiceInfo, balance: number): string {
  const min = money(service.min_balance);
  const heads: Record<string, string> = {
    trading_series: "⚠️ <b>INSUFFICIENT ACCOUNT BALANCE</b>",
    vip_sessions: "⚠️ <b>VIP SESSION REQUIREMENT NOT COMPLETED</b>",
    ai_license: "⚠️ <b>BOT LICENSE REQUIREMENT INCOMPLETE</b>",
    one_to_one: "⚠️ <b>ONE-TO-ONE SESSION REQUIREMENT INCOMPLETE</b>",
  };
  const tail =
    service.service_key === "one_to_one"
      ? "Kindly required balance complete karein. Verification ke baad session timing provide kar di jayegi."
      : "Kindly required balance complete karein aur apni Trader ID dobara send karein.";
  return (
    `${heads[service.service_key] ?? "⚠️ <b>INSUFFICIENT ACCOUNT BALANCE</b>"}\n\n` +
    `Aap ki Trader ID verify ho gayi hai, lekin aap ke account mein minimum ${min} balance available nahi hai.\n\n` +
    `💰 Current balance: <b>${money(balance)}</b>\n` +
    `👉 Deposit <b>${money(shortfall(balance, service.min_balance))}</b> aur karein.\n\n` +
    tail
  );
}

export function depositCheckInsufficientText(service: ServiceInfo, balance: number): string {
  return insufficientText(service, balance);
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
  const handle = settings.onetoone_handle || DEFAULT_SETTINGS.onetoone_handle;
  return (
    `🎉 <b>Mubarak ho!</b> Aap One-to-One Session ke liye eligible hain.\n\n` +
    `📅 Available Session Timings:\n${settings.onetoone_timings}\n\n` +
    `📲 Ab apni booking confirm karne ke liye <b>${handle}</b> ko yeh message bhejein:\n` +
    `<blockquote>"I need one on one personal session, I have verified my id."</blockquote>\n\n` +
    `⚠️ <b>Zaroori:</b> booking ke baad sirf ek message bhejein — iske baad koi aur message na bhejein, warna aap ko jawab nahi mile ga.`
  );
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

// ---------- Chat agent prompt ----------

/** System prompt for the bot's free-chat agent: it answers ONLY about account
 * creation, deposit requirements and the community's services, and must never
 * promise profits or discuss anything else. Pure so it stays unit-testable. */
export function chatAgentSystemPrompt(settings: BotSettings, services: ServiceInfo[]): string {
  const svc = [...services]
    .sort((a, b) => a.sort - b.sort)
    .map((s) => `- ${s.title}: kam se kam ${money(s.min_balance)} balance chahiye`);
  return [
    `Aap "Amir FX Community" Telegram bot ke helper agent hain. Roman Urdu mein, chhote aur dostana jawab dein (zyada se zyada 4 chhoti lines). Koi HTML tags use na karein.`,
    ``,
    `AAP SIRF IN TEEN TOPICS PAR JAWAB DETE HAIN:`,
    `1. Account creation — account kaise banayein aur registration link.`,
    `2. Deposit — har service ke liye kitna minimum balance/deposit chahiye.`,
    `3. Community ki services aur features — neeche di gayi list.`,
    ``,
    `AAP KE PAS YE DATA HAI (sirf yehi use karein, apni taraf se koi link ya number na banayein):`,
    settings.quotex_reg_link ? `- Quotex registration link: ${settings.quotex_reg_link}` : `- Quotex registration link: admin se confirm karein`,
    settings.youtube_link ? `- Free learning classes (YouTube): ${settings.youtube_link}` : ``,
    `Services:`,
    ...(svc.length ? svc : [`- (abhi services list khali hai)`]),
    ``,
    `RULES:`,
    `- Agar sawal in teen topics se bahar ho (jaise profit guarantee, fixed return, signals ki guarantee, trading tips, personal advice, dosri websites ya bots) to politely kaho ke aap sirf account creation, deposit aur services ke baare mein madad kar sakte hain, aur unhe menu ke buttons use karne ka kaho.`,
    `- Kabhi bhi profit ki guarantee, fixed return ya sure-shot ka wada na karo.`,
    `- Trader ID verification sirf bot ke buttons se hoti hai — user ko buttons par guide karein.`,
    `- Jawab chhota rakhein aur user ko agla step clearly batayein.`,
  ].join("\n");
}
