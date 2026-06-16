import nodemailer from "nodemailer"

async function main() {
  const transporter = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false, // false for 587 (uses STARTTLS)
    auth: {
      user: "AKIAW4PIBK3AGZ52QEBX",
      pass: "BFiW4xLZfgKvP1EB1XVvXA4sQd9ckH/P1qLuAJqZ9x/y",
    },
  })

  console.log("Sending test email...")
  try {
    const info = await transporter.sendMail({
      from: '"BlockVibe Test" <info@blockvibe.org>',
      to: "eugen8@gmail.com",
      subject: "AWS SES Test Email",
      text: "This is a test email sent from the blockvibe AWS SES configuration to verify SMTP credentials.",
      html: "<b>This is a test email sent from the blockvibe AWS SES configuration to verify SMTP credentials.</b>",
    })
    console.log("Email sent successfully!")
    console.log("Message ID:", info.messageId)
  } catch (error) {
    console.error("Error sending email:", error)
  }
}

main()
