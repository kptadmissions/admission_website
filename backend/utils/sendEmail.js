import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // ✅ Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ Mail options
    const mailOptions = {
      from: `"KPT Admission" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    // ✅ Send mail
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);
    return info;

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    throw err;
  }
};