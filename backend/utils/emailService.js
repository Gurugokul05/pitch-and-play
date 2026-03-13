const nodemailer = require("nodemailer");
require("dotenv").config();

// Create email transporter based on configuration
let transporter;

const initializeTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS
    ? process.env.EMAIL_PASS.replace(/\s+/g, "")
    : undefined;

  if (emailService === "gmail") {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else if (process.env.EMAIL_HOST) {
    // Custom SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else {
    return null;
  }

  return transporter;
};

/**
 * Send registration confirmation email to team leader
 * @param {string} email - Leader's email address
 * @param {string} teamName - Name of the team
 * @param {string} teamId - Unique team ID
 */
const sendRegistrationEmail = async (email, teamName, teamId) => {
  try {
    if (!transporter) {
      transporter = initializeTransporter();
    }

    if (!transporter) {
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@hackathon.com",
      to: email,
      subject: `Pitch and Play: Team ${teamName} registration confirmed`,
      html: `
        <div style="margin:0;padding:0;background:#0b0c10;">
          <div style="max-width:640px;margin:0 auto;background:#111621;color:#e5e7eb;font-family:'Rajdhani',Arial,sans-serif;border:1px solid rgba(255,255,255,0.08);">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#0b0c10 0%,#171c24 100%);border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:12px;letter-spacing:3px;color:#8c92a1;">PITCH AND PLAY</div>
              <h1 style="margin:10px 0 4px;font-size:24px;font-weight:700;letter-spacing:2px;">MISSION CONTROL</h1>
              <div style="color:#9aa4b2;font-size:13px;">Registration confirmed for Team ${teamName}</div>
            </div>

            <div style="padding:24px 28px;">
              <p style="margin:0 0 12px;">Hi Team Leader,</p>
              <p style="margin:0 0 18px;">Your team has been successfully registered. Keep the details below safe.</p>

              <div style="border:1px solid rgba(255,255,255,0.08);background:#0f141e;padding:16px;border-radius:10px;">
                <div style="display:block;">
                  <div style="margin-bottom:14px;">
                    <div style="font-size:12px;color:#8c92a1;letter-spacing:1px;margin-bottom:4px;">TEAM NAME</div>
                    <div style="font-size:16px;font-weight:600;line-height:1.5;">${teamName}</div>
                  </div>
                  <div style="height:1px;background:rgba(255,255,255,0.08);margin:8px 0 14px;"></div>
                  <div>
                    <div style="font-size:12px;color:#8c92a1;letter-spacing:1px;margin-bottom:4px;">TEAM ID</div>
                    <div style="font-size:18px;font-weight:700;color:#7c5cff;letter-spacing:1px;line-height:1.5;">${teamId}</div>
                  </div>
                </div>
                <div style="margin-top:10px;font-size:12px;color:#a7b0bd;">Save this Team ID. It is required for login and attendance.</div>
              </div>

              <div style="margin-top:20px;">
                <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Next steps</div>
                <ol style="margin:0;padding-left:18px;line-height:1.7;color:#cbd2dd;">
                  <li>Open the platform login page.</li>
                  <li>Select Team Login.</li>
                  <li>Enter Team ID: ${teamId}.</li>
                  <li>Use the team lead email as password</li>
                </ol>
              </div>

              <div style="margin-top:20px;padding:14px 16px;background:#0b0f18;border-left:3px solid #7c5cff;border-radius:6px;">
                <div style="font-size:13px;color:#cbd2dd;">Inside the dashboard you can track attendance rounds, upload submissions, and view announcements.</div>
              </div>

              <div style="margin-top:22px;font-size:12px;color:#8c92a1;">
                Need help? Contact the organizers or reply to the support channel shared during onboarding.
              </div>
            </div>

            <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#8c92a1;">
              This is an automated message. Please do not reply to this address.
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = { sendRegistrationEmail };
