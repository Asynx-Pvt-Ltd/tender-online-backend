export const Otp_template = (otp: any) => {
  const getCurrentFormattedDate = (): string => {
    const currentDate = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
      currentDate
    );

    return formattedDate;
  };
  const formattedDate = getCurrentFormattedDate();
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">

  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" /><!--$-->
  </head>
  
  <body style="background-color:#ffffff;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;text-align:center">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;background-color:#ffffff;border:1px solid #ddd;border-radius:5px;margin-top:20px;width:480px;margin:0 auto;padding:12% 6%">
      <tbody>
        <tr style="width:100%">
          <td>
          <div
          style="display:flex-col; align-items:center; justify-content:center; width:100%; gap:2px;"
          > <img src="https://tenderonline.co.in/logo.jpg" width="240px" height="64px"/> 
           <p style="font-size:18px;line-height:24px;margin:16px 0;font-weight:bold;text-align:center">Complete your Signup</p>
          </div>
           
            <h1 style="text-align:center">Your authentication code</h1>
            <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center">Enter it in your open browser window. This code will expire in 5 minutes.</p>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:280px;max-width:100%">
              <tbody>
                <tr>
                  <td>
                    <h1 style="color:#000;display:inline-block;padding-bottom:8px;padding-top:8px;margin:0 auto;width:100%;text-align:center;letter-spacing:8px">${otp}</h1>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <p style="font-size:14px;line-height:24px;margin:0;color:#444;letter-spacing:0;padding:0 40px;text-align:center">Not expecting this email?</p>
            <p style="font-size:14px;line-height:24px;margin:0;color:#444;letter-spacing:0;padding:0 40px;text-align:center">Ignore<br/> For Further assistance Contact<!-- --> <a href="mailto:support@tenderonline.in" style="color:#444;text-decoration-line:none;text-decoration:underline" target="_blank">support@tenderonline.in</a></p>
          </td>
        </tr>
      </tbody>
    </table><!--/$-->
  </body>

</html>`;
};
