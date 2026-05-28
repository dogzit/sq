import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return _transporter;
}

const FROM = `SideQuest <${process.env.EMAIL_USER || "noreply@sidequest.app"}>`;

export async function sendOtpEmail(to: string, code: string) {
  return getTransporter().sendMail({
    from: FROM,
    to,
    subject: `${code} — SideQuest баталгаажуулах код`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; text-align: center;">
        <h2 style="color: #7C5CFF; margin-bottom: 8px;">SideQuest</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Таны баталгаажуулах код:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background: #f4f0ff; border-radius: 12px; padding: 16px; color: #7C5CFF;">
          ${code}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Энэ код 5 минутын дотор хүчинтэй.</p>
      </div>
    `,
  });
}

export async function sendEmergencyQuestEmail(
  to: string[],
  questTitle: string,
  questDescription: string,
  lobbyName: string,
  expiresInMinutes: number
) {
  const transporter = getTransporter();
  const promises = to.map((email) =>
    transporter.sendMail({
      from: FROM,
      to: email,
      subject: `⚡ Emergency Quest: ${lobbyName}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">⚡</div>
          <h2 style="color: #EF4444; margin-bottom: 4px;">EMERGENCY QUEST!</h2>
          <p style="color: #999; font-size: 13px; margin-bottom: 20px;">${lobbyName}</p>
          <div style="background: #fff5f5; border: 1px solid #fee2e2; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px; color: #1a1a1a;">${questTitle}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">${questDescription}</p>
          </div>
          <div style="background: #fef3c7; border-radius: 8px; padding: 10px; color: #92400e; font-weight: 600; font-size: 14px;">
            ⏱ ${expiresInMinutes} минутын дотор дуусна!
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">SideQuest app-аа нээж оролцоорой!</p>
        </div>
      `,
    })
  );
  return Promise.all(promises);
}
