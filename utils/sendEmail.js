import nodemailer from "nodemailer";

export const sendEmail = async (userEmail, subject, message) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    to: userEmail,
    subject: subject,
    html: message,
    from: "course_bundler@gmail.com",
  });
};
