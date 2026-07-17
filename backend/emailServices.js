// backend/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { marked } from 'marked'; // <-- Import the parser

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', 
  port: 587,              // Explicitly forces the alternative port
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPlanEmail = async (toEmail, markdownPlan) => {
  try {
    // 1. Convert the Gemini Markdown string to raw HTML tags
    const parsedHtmlContent = marked.parse(markdownPlan);

    // 2. Wrap it in a beautifully styled email template
    // Note: Email clients prefer CSS inside a <style> block or inline styles
    const fullHtmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 20px;
            color: #333333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #2563eb;
            color: #ffffff;
            padding: 25px 20px;
            text-align: center;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
          }
          .content {
            padding: 30px;
            line-height: 1.6;
          }
          /* Style the elements that 'marked' generates */
          .content h1, .content h2, .content h3 {
            color: #1e40af;
            margin-top: 25px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .content ul, .content ol {
            padding-left: 20px;
          }
          .content li {
            margin-bottom: 8px;
          }
          .content strong {
            color: #111827;
          }
          .footer {
            background-color: #f3f4f6;
            color: #6b7280;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Your Daily AI Fitness Plan</h2>
          </div>
          <div class="content">
            <!-- Inject the parsed Markdown here -->
            ${parsedHtmlContent}
          </div>
          <div class="footer">
            <p>Powered by your AI Fitness Planner Agent</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: '💪 Your Daily AI Fitness & Meal Plan',
      html: fullHtmlEmail, // <-- Change this from 'text' to 'html'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};