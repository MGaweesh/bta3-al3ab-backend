import 'dotenv/config';
import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

const transporter = nodemailer.createTransport(SMTP_CONFIG);

async function testEmail() {
    console.log('🚀 Starting SMTP Diagnostic...');
    console.log(`📡 Connecting to ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}...`);
    console.log(`👤 User: ${SMTP_CONFIG.auth.user}`);

    try {
        // 1. Verify connection
        await transporter.verify();
        console.log('✅ SMTP Connection Verified!');

        // 2. Send test email
        const testRecipient = 'gawesh1112@gmail.com';
        console.log(`📧 Sending test email to ${testRecipient}...`);

        const info = await transporter.sendMail({
            from: '"Bta3 Al3ab" <support@drgaweesh.online>', // Verified sender provided by user
            to: testRecipient,
            subject: "Test Diagnostic Email 🎮",
            text: "This is a test email from the Bta3 Al3ab diagnostic script. This sender is verified!",
            html: "<b>This is a test email from the Bta3 Al3ab diagnostic script. This sender is verified!</b>"
        });

        console.log('✅ Email Sent Successfully!');
        console.log('📝 Message ID:', info.messageId);
        console.log('💡 If you see this but didnt get the email, check your Spam folder or Brevo dashboard logs.');

    } catch (error) {
        console.error('❌ SMTP Error:', error);
        if (error.response) {
            console.error('💬 Server Response:', error.response);
        }
        console.log('\n🔍 Troubleshooting Tips:');
        console.log('1. Ensure the "from" address is a verified sender in your Brevo dashboard.');
        console.log('2. Check if your SMTP credentials (SMTP_USER/SMTP_PASS) are correct in .env.');
        console.log('3. Ensure port 2525 is not blocked by your firewall/ISP.');
    }
}

testEmail();
