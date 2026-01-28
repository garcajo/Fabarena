import emailjs from '@emailjs/browser';

// These should be set in your .env file
// VITE_EMAILJS_SERVICE_ID=...
// VITE_EMAILJS_TEMPLATE_ID=...
// VITE_EMAILJS_PUBLIC_KEY=...

export const EmailService = {
    /**
     * Sends a generic email using EmailJS
     * @param {Object} templateParams - The parameters to send (e.g., { to_name, from_name, message, reply_to })
     * @returns {Promise}
     */
    sendEmail: async (templateParams) => {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            console.warn('EmailJS credentials missing. Email not sent.');
            return Promise.resolve({ text: 'Simulated: Credentials missing' });
        }

        try {
            return await emailjs.send(serviceId, templateId, templateParams, publicKey);
        } catch (error) {
            console.error('EmailJS Error:', error);
            throw error;
        }
    },

    /**
     * Sends a feedback message
     * @param {string} title 
     * @param {string} message 
     * @param {Object} user 
     */
    sendFeedback: async (title, message, user) => {
        const params = {
            subject: `Feedback: ${title}`,
            from_name: user?.user_metadata?.username || user?.email || 'Anonymous User',
            from_email: user?.email || 'no-email@provided',
            message: message,
            type: 'FEEDBACK'
        };
        return EmailService.sendEmail(params);
    },

    /**
     * Sends a contact message
     * @param {string} email 
     * @param {string} subject 
     * @param {string} message 
     */
    sendContactMessage: async (email, subject, message) => {
        const params = {
            subject: `Contact: ${subject}`,
            from_name: email,
            from_email: email,
            message: message,
            type: 'CONTACT'
        };
        return EmailService.sendEmail(params);
    }
};
