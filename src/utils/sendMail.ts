import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { env } from "../configs/env";
import { CustomError } from "./CustomError";
import { ResponseStatus } from "./constants";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Task Manager",
    link: env.APP_URL,
  },
});

const sendMail = async (
  email: string,
  subject: string,
  content: Mailgen.Content
) => {
  const transporter = nodemailer.createTransport({
    host: env.MAILTRAP_HOST,
    port: +env.MAILTRAP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: env.MAILTRAP_USERNAME,
      pass: env.MAILTRAP_PASSWORD,
    },
  });

  const html = mailGenerator.generate(content);
  const text = mailGenerator.generatePlaintext(content);

  try {
    await transporter.sendMail({
      from: env.MAILTRAP_SENDERMAIL,
      to: email,
      subject,
      text,
      html,
    });
  } catch (err) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Failed to send "${subject}" email.`
    );
  }
};

const emailVerificationMailContent = (username: string, link: string) => {
  return {
    body: {
      name: username,
      intro: "Welcome to Task Manager! We're thrilled to have you.",
      action: {
        instructions: "Click below to verify your email:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Verify Email",
          link: link,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const resetPasswordMailContent = (username: string, link: string) => {
  return {
    body: {
      name: username,
      intro: "It seems like you requested a password reset.",
      action: {
        instructions: "Click below to reset your password:",
        button: {
          color: "#FF613C", // Optional action button color
          text: "Reset Password",
          link: link,
        },
      },
      outro: "If you didn’t request this, you can ignore this email.",
    },
  };
};

const sendVerificationMail = async (
  username: string,
  email: string,
  token: string
) => {
  const link = `${env.APP_URL}/api/v1/user/verify/${token}`;

  await sendMail(
    email,
    "Verify Your Email",
    emailVerificationMailContent(username, link)
  );
};

const sendResetPasswordMail = async (
  username: string,
  email: string,
  token: string
) => {
  const link = `${env.APP_URL}/api/v1/user/reset-password/${token}`;

  await sendMail(
    email,
    "Reset Your Password",
    resetPasswordMailContent(username, link)
  );
};

export { sendVerificationMail, sendResetPasswordMail };
