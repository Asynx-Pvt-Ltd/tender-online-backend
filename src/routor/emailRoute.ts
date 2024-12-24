import { Request, Response } from "express";
import { transporter } from "../nodemailer";
var express = require("express");
var emailRouter = express.Router();
const User = require("../model/user.model");
emailRouter.post("/create/review", async (req: Request, res: Response) => {
  try {
    const { email, subject, html_template } = req.body;
    var mailOptions = {
      to: "gokulakrishnanr812@gmail.com",
      from: email,
      subject: subject,
      html: `${html_template}`,
    };
    transporter.sendMail(mailOptions, function (error: any, info: any) {
      if (error) {
        console.log(error);
        return;
      }

      transporter.close();
    });
    return res.status(200).json({
      message: "Email has been sent",
      status: "success",
      code: 200,
      data: [],
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "something went wrong !" });
  }
});

emailRouter.post("/all", async (req: Request, res: Response) => {
  try {
    const { subject, html_template } = req.body;
    const users = await User.find({}); // replace with your user model

    for (const user of users) {
      const mailOptions = {
        to: user.email,
        from: "your_email@example.com", // replace with your email
        subject: subject,
        html: html_template,
      };

      // Send email to each user
      transporter.sendMail(mailOptions, function (error: any, info: any) {
        if (error) {
          console.log(error);
          return;
        }

        console.log("Email sent to:", user.email);
      });
    }

    transporter.close();

    return res.status(200).json({
      message: "Emails sent successfully",
      status: "success",
      code: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

emailRouter.post("/sendEmail", async (req: Request, res: Response) => {
  try {
    const { email, subject, html_template } = req.body;

    const options = {
      from: "noreply@tenderonline.in",
      to: email,
      subject,
      html: html_template,
    };

    transporter.sendMail(options);
    transporter.close();
    return res.status(200).json({});
  } catch (error) {
    return res.status(500).json({});
  }
});

module.exports = emailRouter;
