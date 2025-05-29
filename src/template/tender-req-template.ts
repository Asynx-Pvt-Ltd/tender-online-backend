export const TenderRequest_template = (tenderData: any) => {
	const getCurrentFormattedDate = (): string => {
		const currentDate = new Date();
		const options: Intl.DateTimeFormatOptions = {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		};
		const formattedDate = new Intl.DateTimeFormat('en-US', options).format(
			currentDate,
		);
		return formattedDate;
	};

	const formatDate = (dateString: string): string => {
		if (!dateString) return 'Not specified';
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		};
		return new Intl.DateTimeFormat('en-US', options).format(date);
	};

	const formatCurrency = (value: number): string => {
		if (!value) return 'Not specified';
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
		}).format(value);
	};

	const formattedDate = getCurrentFormattedDate();

	return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">

  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  
  <body style="background-color:#ffffff;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;background-color:#ffffff;border:1px solid #ddd;border-radius:5px;margin-top:20px;width:600px;margin:0 auto;padding:40px">
      <tbody>
        <tr style="width:100%">
          <td>
            <div style="display:flex-col; align-items:center; justify-content:center; width:100%; gap:2px;">
              <img src="https://tenderonline.co.in/logo.jpg" width="240px" height="64px"/> 
              <p style="font-size:18px;line-height:24px;margin:16px 0;font-weight:bold;text-align:center;color:#2563eb">New Tender Request Received</p>
            </div>
           
            <h1 style="text-align:center;color:#1f2937;margin:20px 0">Tender Request Details</h1>
            <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center;color:#6b7280">A new tender request has been submitted on ${formattedDate}</p>
            
            <!-- Tender Details Table -->
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="background:#f9fafb;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb">
              <tbody>
                <tr>
                  <td style="padding:20px">
                    <h2 style="color:#1f2937;margin:0 0 16px 0;font-size:16px;font-weight:600">Tender Information</h2>
                    
                    <table width="100%" border="0" cellPadding="0" cellSpacing="0" style="font-size:14px;line-height:20px">
                      <tr>
                        <td style="padding:8px 0;font-weight:600;color:#374151;width:30%">Tender Title:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.tenderTitle || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">Tender ID:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.tenderId || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">Reference No:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.refNo || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">Industry:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.industry || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">Tender Value:</td>
                        <td style="padding:8px 0;color:#16a34a;font-weight:600">${formatCurrency(
													tenderData.tenderValue,
												)}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">Bid Submission Date:</td>
                        <td style="padding:8px 0;color:#dc2626;font-weight:600">${formatDate(
													tenderData.bidSubmissionDate,
												)}</td>
                      </tr>
                    </table>
                    
                    <h3 style="color:#1f2937;margin:20px 0 12px 0;font-size:16px;font-weight:600">Location Details</h3>
                    <table width="100%" border="0" cellPadding="0" cellSpacing="0" style="font-size:14px;line-height:20px">
                      <tr>
                        <td style="padding:8px 0;font-weight:600;color:#374151;width:30%">State:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.state || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">District:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.district || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">Location:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.location || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151;vertical-align:top">Address:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.address || 'Not specified'
												}</td>
                      </tr>
                    </table>
                    
                    <h3 style="color:#1f2937;margin:20px 0 12px 0;font-size:16px;font-weight:600">User Information</h3>
                    <table width="100%" border="0" cellPadding="0" cellSpacing="0" style="font-size:14px;line-height:20px">
                      <tr>
                        <td style="padding:8px 0;font-weight:600;color:#374151;width:30%">User Name:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.userName || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">User Email:</td>
                        <td style="padding:8px 0;color:#1f2937">${
													tenderData.userEmail || 'Not specified'
												}</td>
                      </tr>
                      <tr style="border-top:1px solid #e5e7eb">
                        <td style="padding:8px 0;font-weight:600;color:#374151">User ID:</td>
                        <td style="padding:8px 0;color:#6b7280">${
													tenderData.userId || 'Not specified'
												}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Action Required Section -->
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
              <p style="font-size:14px;line-height:20px;margin:0;color:#92400e">
                <strong>Action Required:</strong> Please review this tender request and take appropriate action.
              </p>
            </div>
            
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0" />
            
            <p style="font-size:12px;line-height:18px;margin:0;color:#6b7280;text-align:center">
              This is an automated notification from TenderOnline System<br/>
              Generated on ${formattedDate}<br/>
              For support, contact <a href="mailto:support@tenderonline.in" style="color:#2563eb;text-decoration:none" target="_blank">support@tenderonline.in</a>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </body>

</html>`;
};
