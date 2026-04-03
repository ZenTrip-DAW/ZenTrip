const axios = require('axios');

const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET;
const MAILJET_SENDER_EMAIL = process.env.MAILJET_SENDER_EMAIL;
const MAILJET_SENDER_NAME = process.env.MAILJET_SENDER_NAME || 'ZenTrip';

const MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send';

function assertMailjetConfig() {
  if (!MAILJET_API_KEY || !MAILJET_API_SECRET || !MAILJET_SENDER_EMAIL) {
    throw new Error('Faltan variables de Mailjet: MAILJET_API_KEY, MAILJET_API_SECRET o MAILJET_SENDER_EMAIL');
  }
}

function buildMailjetAuth() {
  return `Basic ${Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString('base64')}`;
}

async function sendTripInvitationEmail({ toEmail, toName, tripName, creatorName, tripLink, invitationToken, recipientIsRegistered = false }) {
  assertMailjetConfig();

  const safeName = toName || toEmail;
  const subject = `Te han invitado a un viaje en ZenTrip: ${tripName}`;
  const registerLink = invitationToken ? `${tripLink}?inviteToken=${invitationToken}` : tripLink;
  const ctaText = recipientIsRegistered ? 'Inicia sesión y acepta la invitación' : 'Regístrate y acepta la invitación';
  const guidanceText = recipientIsRegistered
    ? 'Si ya tienes cuenta, inicia sesión desde este enlace para aceptar la solicitud y unirte al viaje.'
    : 'Si te registras desde este enlace, automáticamente aceptarás unirte al viaje.';

  const text = [
    `Hola ${safeName},`,
    '',
    `${creatorName || 'Alguien'} te ha invitado al viaje "${tripName}" en ZenTrip.`,
    `Puedes continuar aquí: ${registerLink}`,
    '',
    guidanceText,
    '',
    `Si tienes problemas con el botón, abre este enlace: ${registerLink}`,
    '',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n');

  const html = `
    <div style="margin:0; padding:24px 12px; background-color:#d0dfff; font-family:Roboto, Arial, sans-serif; color:#34302F;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e8e6e6; border-radius:16px; overflow:hidden;">
        <tr>
          <td style="padding:24px 24px 18px; background:#004C87;">
            <div style="font-family:Montserrat, Arial, sans-serif; font-size:28px; font-weight:700; line-height:1; color:#ffffff; letter-spacing:0.2px;">
              Zen<span style="color:#FE6B01;">Trip</span>
            </div>
            <p style="margin:14px 0 0; font-size:14px; color:#D0DFFF;">Invitación a viaje</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;">
            <h2 style="margin:0 0 12px; font-family:Montserrat, Arial, sans-serif; font-size:24px; line-height:1.25; color:#004C87;">Te han invitado a una nueva aventura</h2>

            <p style="margin:0 0 12px; font-size:16px; color:#34302F;">Hola <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 16px; font-size:15px; color:#56504E; line-height:1.6;">
              <strong style="color:#004C87;">${creatorName || 'Alguien'}</strong> te invitó al viaje
              <strong style="color:#004C87;">${tripName}</strong>.
            </p>

            <div style="margin:0 0 18px; padding:12px 14px; border:1px solid #8DB9FF; border-radius:10px; background:#f7fbff;">
              <p style="margin:0; font-size:14px; color:#004C87; line-height:1.5;">${guidanceText}</p>
            </div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
              <tr>
                <td align="center" bgcolor="#FE6B01" style="border-radius:10px;">
                  <a href="${registerLink}" target="_blank" rel="noreferrer" style="display:inline-block; padding:12px 20px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Roboto, Arial, sans-serif;">
                    ${ctaText}
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px; font-size:12px; color:#7A7270;">¿No funciona el botón?</p>
            <p style="margin:0; font-size:12px; color:#56504E; word-break:break-all;">
              <a href="${registerLink}" target="_blank" rel="noreferrer" style="color:#016FC1; text-decoration:underline;">${registerLink}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:14px 24px 20px; border-top:1px solid #E8E6E6;">
            <p style="margin:0; font-size:12px; color:#7A7270; line-height:1.5;">
              Si no esperabas este correo, puedes ignorarlo.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  try {
    const response = await axios.post(
      MAILJET_SEND_URL,
      {
        Messages: [
          {
            From: {
              Email: MAILJET_SENDER_EMAIL,
              Name: MAILJET_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: safeName,
              },
            ],
            Subject: subject,
            TextPart: text,
            HTMLPart: html,
          },
        ],
      },
      {
        headers: {
          Authorization: buildMailjetAuth(),
          'Content-Type': 'application/json',
        },
      },
    );

    const messageResult = response?.data?.Messages?.[0];
    const status = messageResult?.Status;
    const errors = messageResult?.Errors || [];
    const toResult = messageResult?.To?.[0] || null;

    if (status !== 'success') {
      throw new Error(
        `Mailjet message status '${status || 'unknown'}' for ${toEmail}. Errors: ${JSON.stringify(errors)}`,
      );
    }

    return {
      status,
      to: toResult,
      customId: messageResult?.CustomID || null,
    };
  } catch (error) {
    const mailjetError = error?.response?.data;
    const message = mailjetError
      ? `Mailjet error: ${JSON.stringify(mailjetError)}`
      : error.message;
    throw new Error(message);
  }
}

module.exports = { sendTripInvitationEmail };