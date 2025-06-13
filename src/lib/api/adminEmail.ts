type EmailType = 'new_user' | 'new_author' | 'new_contact_form' | 'new_subscription';

interface EmailData {
  type: EmailType;
  username?: string;
  email?: string;
  role?: string;
  message?: string;
  subject?: string;
}

export async function sendAdminEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error sending admin email:', err);
    return { success: false, error: 'Network error' };
  }
}

// Helper functions for specific email types
export const adminEmail = {
  newUser: (username: string, email: string, role: string) => 
    sendAdminEmail({ type: 'new_user', username, email, role }),
  
  newAuthor: (username: string, email: string) => 
    sendAdminEmail({ type: 'new_author', username, email }),
  
  newContactForm: (message: string, subject?: string) => 
    sendAdminEmail({ type: 'new_contact_form', message, subject }),
  
  newSubscription: (email: string) => 
    sendAdminEmail({ type: 'new_subscription', email }),
};