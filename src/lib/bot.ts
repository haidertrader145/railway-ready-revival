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
  callback_data?: string;
  url?: string;
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

/** Every single bot message carries a clickable "Register Now" button that
 * opens the registration link — for verified and unverified users alike. */
export const REG_BUTTON_TEXT = "🆓 CREATE FREE QUOTEX ACCOUNT";

export function regButtonRow(link: string): InlineButton[] {
  if (!link) return [];
  return [{ text: REG_BUTTON_TEXT, url: link }];
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
  const rows: InlineButton[][] = [...services]
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

export function notRegisteredText(traderId: string, _platform: Platform, settings: BotSettings): string {
  const link = settings.quotex_reg_link;
  let t =
    `❌ <b>TRADER ID VERIFICATION FAILED</b>\n\n` +
    `Dear Trader!\n\n` +
    `Aap ki provide ki gayi Quotex Trader ID <b>${traderId}</b> verify nahi ho saki.\n\n` +
    `Kindly apni correct Trader ID dobara send karein.\n\n` +
    `Agar aap ne abhi tak hamare Official Community Link se account create nahi kiya, to neeche diye gaye CREATE FREE QUOTEX ACCOUNT button se register karein.\n\n`;
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

/** Loss/distress messages receive free education support, not deposit promotion. */
export function needsFreeLearningSupport(text: string): boolean {
  return /\b(loss(?:es)?|lost\s+(?:my\s+)?money|lost\s+(?:everything|all)|recover\s+(?:my\s+)?loss|worried|worry|anxious|majboor|majbur|majb[oou]+ri|pareshan|broke|can't\s+afford|cannot\s+afford|qarz|karz|nuksan|nuqsan|nuksaan|nuqsaan)\b|پیسے.*(?:کھو|ہار)|نقصان|مجبور|قرض|پریشان/i.test(text);
}

export function freeLearningSupportReply(settings: BotSettings): string {
  return [
    "Aap ki pareshani samajh sakte hain. Amir FX Community mein aap free learning aur educational support se shuru kar sakte hain.",
    "Abhi loss recover karne ke liye mazeed deposit ya trade karne ka pressure na lein; pehle break aur learning par focus karein.",
    settings.youtube_link ? `Hamari free classes: ${settings.youtube_link}` : "Main Menu mein Trading Learning – Free Classes select karein.",
    "Free learning ke liye deposit zaroori nahi; learning se loss recovery ki guarantee nahi hoti.",
  ].join("\n");
}

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
    `ADDITIONAL GUIDANCE — FREE SERVICES, BROKER FUNDING AND VIP JOINING:`,
    `- Hamari trading education, signals aur community services free hain. Service eligibility ke liye broker account balance ki shart service fee nahi hai; paisay hamein nahi dene.`,
    `- Interested user VIP join karna chahe to clear call to action dein: "VIP access ke liye aap ke apne Quotex broker account mein kam az kam $50 balance hona chahiye." Agar pehle se required balance hai to mazeed deposit ki zaroorat nahi. Current service list ke actual minimum balance ko follow karein.`,
    `- Normal joining sawalon mein steps samjhayein: CREATE FREE QUOTEX ACCOUNT button se configured community registration link par account banayein; agar balance required minimum se kam ho to sirf apne broker account ko directly fund karein; Quotex Trading button se Trader ID verify karein; phir VIP Sessions select karein. Funds customer ke apne broker account mein aur unke control mein rehte hain, Amir FX ko transfer nahi hote.`,
    `- Account setup, deposits aur VIP eligibility ke sawalon ka seedha jawab dein aur interested customers ko community join karne ki dawat dein. Deposits ko free services ki payment ya guaranteed protection na kahein.`,
    `- Genuine past performance ko sirf supplied, documented results ki bunyaad par confidently discuss karein. Abhi performance records supplied nahi hain: win rate, returns, testimonials ya results invent na karein; past performance future profits ki guarantee nahi.`,
    `- Agar user worried, anxious, pareshan ho ya losses report kare to hamdardi aur free educational support offer karein; VIP funding ka call to action, additional deposit ya loss recovery promotion na dein. Yeh safety rule normal joining invitations par priority rakhta hai.`,
    `EXISTING RULES (CONTINUE TO APPLY):`,
    `- Relevant jawab mein Amir FX Community ki free learning aur educational support recommend karein. Free classes ke liye deposit ya Trader ID verification ki shart na lagayein. Sirf configured YouTube link share karein; VIP ya Trading Series ko free community ka link samajh kar share na karein.`,
    `- Hamesha Amir FX Community ke baare mein positive, confident aur supportive lehje mein baat karein. Community, Amir sahab ya services ki kabhi burai, shak ya negative comparison na karein, aur user ko dosri communities, bots ya websites ki taraf na bhejein.`,
    `- Aam sawalon (jo loss ya financial pareshani ke baare mein na hon) mein user ko hamari services — VIP Sessions, Trading Series, AI License aur One-to-One — join karne ki dawat dein, unke faide (seekhna, live sessions, guidance) aur minimum deposit batayein, aur agla step (account banana → Trader ID verify → service chunna) samjhayein.`,
    `- Agar user loss, paise haarne, majboori, qarz ya financial pareshani bataye to hamdardi se jawab dein aur free learning recommend karein. Deposit, VIP, AI bot ya paid service ko loss recover karne ka tareeqa na batayein; loss chase karne ya udhaar le kar trading karne ko encourage na karein.`,
    `- Community ko independently verified, certified, real ya legit keh kar apni taraf se tasdeeq na karein. Education aur support ka zikr karein, recovery ka wada nahi.`,
    `- Agar sawal in teen topics se bahar ho (jaise profit guarantee, fixed return, signals ki guarantee, trading tips, personal advice, dosri websites ya bots) to politely kaho ke aap sirf account creation, deposit aur services ke baare mein madad kar sakte hain, aur unhe menu ke buttons use karne ka kaho.`,
    `- Kabhi bhi profit ki guarantee, fixed return ya sure-shot ka wada na karo.`,
    `- Trader ID verification sirf bot ke buttons se hoti hai — user ko buttons par guide karein.`,
    `- Jawab chhota rakhein aur user ko agla step clearly batayein.`,
  ].join("\n");
}
