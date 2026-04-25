export const applicationSubmittedTemplate = (name) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

      <div style="background:#4f46e5; color:white; padding:20px; text-align:center;">
        <h2>KPT Admissions</h2>
      </div>

      <div style="padding:20px;">
        <h3>Hello ${name},</h3>
        <p>Your application has been <b>successfully submitted</b>.</p>

        <p>Our team will review your application soon. You will be notified about further updates.</p>

        <div style="margin:20px 0; padding:15px; background:#eef2ff; border-left:4px solid #4f46e5;">
          <b>Status:</b> Submitted ✅
        </div>

        <p>Thank you for applying to KPT.</p>

        <br/>
        <p style="color:#555;">Regards,<br/>KPT Admission Team</p>
      </div>

      <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px;">
        © 2026 KPT Admissions
      </div>

    </div>
  </div>
  `;
};
export const applicationResubmittedTemplate = (name) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

      <div style="background:#f59e0b; color:white; padding:20px; text-align:center;">
        <h2>KPT Admissions</h2>
      </div>

      <div style="padding:20px;">
        <h3>Hello ${name},</h3>

        <p>Your application has been <b>resubmitted successfully</b> after correction.</p>

        <div style="margin:20px 0; padding:15px; background:#fff7ed; border-left:4px solid #f59e0b;">
          <b>Status:</b> Resubmitted 🔄
        </div>

        <p>Our team will review your updated application again.</p>

        <p>Please wait for further updates regarding verification.</p>

        <br/>
        <p style="color:#555;">Regards,<br/>KPT Admission Team</p>
      </div>

      <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px;">
        © 2026 KPT Admissions
      </div>

    </div>
  </div>
  `;
};