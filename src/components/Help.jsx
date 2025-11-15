import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Help.css'

export default function Help() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <>
          <h3>Welcome to Contactium!</h3>
          <p>Contactium is your AI-powered cold email outreach platform that helps you connect with potential clients and grow your business.</p>

          <h4>Quick Start Guide:</h4>
          <ol>
            <li><strong>Set up your account:</strong> Go to Settings to configure your email and subscription plan</li>
            <li><strong>Create contact lists:</strong> Organize your prospects into targeted lists</li>
            <li><strong>Launch campaigns:</strong> Create AI-powered email campaigns to reach your audience</li>
            <li><strong>Track results:</strong> Monitor opens, replies, and engagement on your Dashboard</li>
          </ol>

          <div className="help-tip">
            <span className="tip-icon">💡</span>
            <div>
              <strong>Pro Tip:</strong> Start with a small contact list to test your campaign messaging before scaling up.
            </div>
          </div>
        </>
      )
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '📊',
      content: (
        <>
          <h3>Understanding Your Dashboard</h3>
          <p>The Dashboard is your command center for monitoring all campaign activity.</p>

          <h4>Key Metrics:</h4>
          <ul>
            <li><strong>Active Campaigns:</strong> Number of campaigns currently running</li>
            <li><strong>Emails Sent:</strong> Total emails sent across all campaigns</li>
            <li><strong>Response Rate:</strong> Percentage of emails that received replies</li>
            <li><strong>Companies:</strong> Number of companies in your database</li>
          </ul>

          <h4>Recent Campaigns Table:</h4>
          <p>View your recent campaigns with key metrics:</p>
          <ul>
            <li>Campaign name and status (Active/Paused/Completed)</li>
            <li>Number of emails sent</li>
            <li>Response rate</li>
            <li>Creation date</li>
          </ul>

          <h4>Quick Actions:</h4>
          <ul>
            <li><strong>Create Campaign:</strong> Start a new email outreach campaign</li>
            <li><strong>View Details:</strong> Click on any campaign to see detailed analytics</li>
            <li><strong>Send Now:</strong> Manually trigger campaign emails</li>
          </ul>
        </>
      )
    },
    {
      id: 'campaigns',
      title: 'Creating Campaigns',
      icon: '📧',
      content: (
        <>
          <h3>How to Create Effective Campaigns</h3>

          <h4>Step 1: Campaign Details</h4>
          <ul>
            <li><strong>Campaign Name:</strong> Choose a descriptive name (e.g., "Tech Startups Q4 2025")</li>
            <li><strong>Subject Line:</strong> Craft an attention-grabbing subject (keep it under 60 characters)</li>
          </ul>

          <h4>Step 2: Email Content</h4>
          <ul>
            <li><strong>Manual Mode:</strong> Write your email template with personalization variables</li>
            <li><strong>AI Mode:</strong> Let AI generate personalized emails based on your prompt</li>
          </ul>

          <h4>Personalization Variables:</h4>
          <div className="code-block">
            {`{company_name} - Recipient's company name
{recipient_name} - Recipient's name
{your_name} - Your name
{your_company} - Your company name`}
          </div>

          <h4>Step 3: Target Audience</h4>
          <ul>
            <li><strong>Select Companies:</strong> Choose from your Companies list</li>
            <li><strong>Select Contact List:</strong> Use pre-organized contact lists</li>
            <li><strong>Filter:</strong> Apply filters to target specific segments</li>
          </ul>

          <h4>Step 4: Schedule & Launch</h4>
          <ul>
            <li><strong>Send Immediately:</strong> Launch campaign right away</li>
            <li><strong>Schedule:</strong> Set a specific date and time</li>
            <li><strong>Save as Draft:</strong> Come back to it later</li>
          </ul>

          <div className="help-warning">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Important:</strong> Always review your email content and test with a small group before sending to your entire list.
            </div>
          </div>
        </>
      )
    },
    {
      id: 'contact-lists',
      title: 'Contact Lists',
      icon: '📋',
      content: (
        <>
          <h3>Managing Contact Lists</h3>
          <p>Contact Lists help you organize prospects into targeted groups for more effective campaigns.</p>

          <div className="help-notice">
            <span className="notice-icon">🔒</span>
            <div>
              <strong>Note:</strong> Contact Lists are available on Starter and Professional plans.
            </div>
          </div>

          <h4>Creating a Contact List:</h4>
          <ol>
            <li>Navigate to "Contact Lists" in the main menu</li>
            <li>Click "+ New List"</li>
            <li>Enter a name (e.g., "Tech Startups", "Warm Leads")</li>
            <li>Add an optional description</li>
            <li>Click "Create List"</li>
          </ol>

          <h4>Adding Contacts:</h4>
          <ol>
            <li>Open your contact list</li>
            <li>Click "+ Add Contact"</li>
            <li>Fill in contact details:
              <ul>
                <li>Email (required)</li>
                <li>Name</li>
                <li>Company</li>
                <li>Notes</li>
              </ul>
            </li>
            <li>Click "Add Contact"</li>
          </ol>

          <h4>Best Practices:</h4>
          <ul>
            <li><strong>Segment by industry:</strong> Group contacts by their industry or niche</li>
            <li><strong>Segment by stage:</strong> Separate cold leads from warm prospects</li>
            <li><strong>Keep lists updated:</strong> Remove bounced emails and unsubscribes</li>
            <li><strong>Add notes:</strong> Record important context about each contact</li>
          </ul>

          <h4>Managing Lists:</h4>
          <ul>
            <li><strong>View Contacts:</strong> See all contacts in a list with their details</li>
            <li><strong>Delete Contacts:</strong> Remove individual contacts</li>
            <li><strong>Delete List:</strong> Remove entire list (this deletes all contacts in the list)</li>
          </ul>
        </>
      )
    },
    {
      id: 'companies',
      title: 'Companies Database',
      icon: '🏢',
      content: (
        <>
          <h3>Building Your Companies Database</h3>
          <p>The Companies database helps you organize and target businesses for your outreach campaigns.</p>

          <h4>Adding Companies:</h4>
          <ol>
            <li>Go to "Companies" in the main menu</li>
            <li>Click "+ Add Company"</li>
            <li>Enter company information:
              <ul>
                <li>Company Name (required)</li>
                <li>Website</li>
                <li>Industry</li>
                <li>Contact Email</li>
                <li>Description/Notes</li>
              </ul>
            </li>
            <li>Click "Add Company"</li>
          </ol>

          <h4>Using Companies in Campaigns:</h4>
          <p>When creating a campaign, you can select specific companies to target. The campaign will use the contact information associated with each company.</p>

          <h4>Company Management:</h4>
          <ul>
            <li><strong>Edit:</strong> Update company details as information changes</li>
            <li><strong>Delete:</strong> Remove companies you no longer want to target</li>
            <li><strong>Search:</strong> Use the search bar to quickly find companies</li>
            <li><strong>Filter:</strong> Filter by industry or other criteria</li>
          </ul>

          <div className="help-tip">
            <span className="tip-icon">💡</span>
            <div>
              <strong>Pro Tip:</strong> Add detailed notes about each company, including why they're a good fit and any previous interactions.
            </div>
          </div>
        </>
      )
    },
    {
      id: 'subscription',
      title: 'Subscription Plans',
      icon: '💳',
      content: (
        <>
          <h3>Understanding Subscription Plans</h3>
          <p>Choose the plan that best fits your outreach needs.</p>

          <h4>Free Plan</h4>
          <ul>
            <li>10 AI emails per month</li>
            <li>Up to 25 contacts</li>
            <li>1 active campaign</li>
            <li>Basic analytics</li>
          </ul>

          <h4>Starter Plan - €29/month</h4>
          <ul>
            <li>500 AI emails per month</li>
            <li>Up to 1,000 contacts</li>
            <li>5 active campaigns</li>
            <li>Contact Lists feature</li>
            <li>Advanced analytics</li>
            <li>Email support</li>
          </ul>

          <h4>Professional Plan - €79/month</h4>
          <ul>
            <li>2,500 AI emails per month</li>
            <li>Up to 10,000 contacts</li>
            <li>20 active campaigns</li>
            <li>Contact Lists feature</li>
            <li>Priority analytics</li>
            <li>Priority email support</li>
            <li>API access (coming soon)</li>
          </ul>

          <h4>Managing Your Subscription:</h4>
          <ol>
            <li>Go to Settings and scroll to "Subscription & Billing"</li>
            <li>View your current plan and usage</li>
            <li>Click upgrade buttons to change plans</li>
            <li>Click "Manage Subscription" to update payment method or cancel</li>
          </ol>

          <div className="help-notice">
            <span className="notice-icon">ℹ️</span>
            <div>
              <strong>Note:</strong> You can cancel your subscription anytime. No long-term commitments required.
            </div>
          </div>
        </>
      )
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      content: (
        <>
          <h3>Configuring Your Account</h3>

          <h4>Profile Settings:</h4>
          <ul>
            <li><strong>Email:</strong> Your account email (used for login)</li>
            <li><strong>Display Name:</strong> Name shown in your emails</li>
            <li><strong>Company Name:</strong> Your company name for email signatures</li>
          </ul>

          <h4>Email Configuration:</h4>
          <ul>
            <li><strong>From Email:</strong> The email address your campaigns will send from</li>
            <li><strong>Reply-To Email:</strong> Where replies should be sent</li>
            <li><strong>Email Signature:</strong> Customize your email signature</li>
          </ul>

          <h4>Subscription & Billing:</h4>
          <ul>
            <li>View current plan and features</li>
            <li>Monitor monthly email usage</li>
            <li>Upgrade or downgrade plans</li>
            <li>Update payment method</li>
            <li>View billing history</li>
          </ul>

          <h4>Preferences:</h4>
          <ul>
            <li><strong>Email Notifications:</strong> Control which notifications you receive</li>
            <li><strong>Time Zone:</strong> Set your local time zone for scheduling</li>
            <li><strong>Language:</strong> Choose your preferred language</li>
          </ul>

          <h4>Security:</h4>
          <ul>
            <li><strong>Change Password:</strong> Update your account password</li>
            <li><strong>Two-Factor Authentication:</strong> Add extra security (coming soon)</li>
            <li><strong>Active Sessions:</strong> View and manage logged-in devices</li>
          </ul>
        </>
      )
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: '✨',
      content: (
        <>
          <h3>Cold Email Best Practices</h3>

          <h4>Email Deliverability:</h4>
          <ul>
            <li><strong>Warm up your domain:</strong> Start with small volumes and gradually increase</li>
            <li><strong>Personalize:</strong> Use recipient names and company information</li>
            <li><strong>Avoid spam triggers:</strong> No all caps, excessive exclamation marks!!!, or spammy words</li>
            <li><strong>Include unsubscribe option:</strong> Always provide an easy way to opt-out</li>
          </ul>

          <h4>Writing Effective Cold Emails:</h4>
          <ul>
            <li><strong>Keep it short:</strong> 50-150 words is ideal</li>
            <li><strong>Personalize the subject:</strong> Mention their company or industry</li>
            <li><strong>Lead with value:</strong> Explain what's in it for them</li>
            <li><strong>One clear CTA:</strong> Single, specific call-to-action</li>
            <li><strong>Professional signature:</strong> Include your contact information</li>
          </ul>

          <h4>Email Structure Template:</h4>
          <div className="code-block">
{`Subject: [Personalized to recipient]

Hi {recipient_name},

[Opening line - show you researched them]

[Value proposition - what problem you solve]

[Social proof - brief credibility]

[Specific CTA - ask for meeting/call]

Best regards,
[Your name]
[Your company]
[Contact info]`}
          </div>

          <h4>Timing & Follow-ups:</h4>
          <ul>
            <li><strong>Best days:</strong> Tuesday, Wednesday, Thursday</li>
            <li><strong>Best times:</strong> Early morning (8-10 AM) or late afternoon (4-6 PM)</li>
            <li><strong>Follow-up sequence:</strong> Wait 3-4 days between follow-ups</li>
            <li><strong>Maximum follow-ups:</strong> 2-3 follow-ups before moving on</li>
          </ul>

          <h4>Compliance:</h4>
          <div className="help-warning">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Legal Requirements:</strong>
              <ul>
                <li>Include your physical business address</li>
                <li>Provide clear unsubscribe mechanism</li>
                <li>Honor unsubscribe requests within 10 days</li>
                <li>Don't use misleading subject lines</li>
                <li>Comply with GDPR, CAN-SPAM, and local laws</li>
              </ul>
            </div>
          </div>

          <h4>Measuring Success:</h4>
          <ul>
            <li><strong>Open Rate:</strong> 20-30% is good for cold emails</li>
            <li><strong>Reply Rate:</strong> 1-5% is typical for cold outreach</li>
            <li><strong>Meeting Booked Rate:</strong> 0.5-2% is a strong conversion</li>
          </ul>

          <div className="help-tip">
            <span className="tip-icon">💡</span>
            <div>
              <strong>Pro Tip:</strong> Test different subject lines and email copy with small segments before sending to your entire list.
            </div>
          </div>
        </>
      )
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: '❓',
      content: (
        <>
          <h3>Frequently Asked Questions</h3>

          <div className="faq-item">
            <h4>How does the AI email generation work?</h4>
            <p>Our AI uses your prompt and recipient information to generate personalized cold emails. It analyzes successful email patterns and creates engaging, professional messages tailored to each recipient.</p>
          </div>

          <div className="faq-item">
            <h4>Can I use my own email server?</h4>
            <p>Currently, Contactium sends emails through our infrastructure to ensure deliverability. Custom email server integration is coming soon for Professional plan users.</p>
          </div>

          <div className="faq-item">
            <h4>What happens if I exceed my email limit?</h4>
            <p>When you reach your monthly email limit, you won't be able to send more campaigns until the next billing cycle. You can upgrade your plan anytime to increase your limit.</p>
          </div>

          <div className="faq-item">
            <h4>Can I cancel my subscription?</h4>
            <p>Yes! You can cancel anytime through Settings → Subscription & Billing → Manage Subscription. Your subscription will remain active until the end of your current billing period.</p>
          </div>

          <div className="faq-item">
            <h4>How do I improve my email deliverability?</h4>
            <p>Follow these tips: personalize your emails, avoid spam trigger words, keep volumes moderate initially, maintain a good sender reputation, and always include an unsubscribe link.</p>
          </div>

          <div className="faq-item">
            <h4>Can I import contacts from a CSV file?</h4>
            <p>CSV import is coming soon! Currently, you can add contacts manually through Contact Lists.</p>
          </div>

          <div className="faq-item">
            <h4>Do you provide email templates?</h4>
            <p>Yes! When creating a campaign, you can choose from pre-built templates or use AI to generate custom email content based on your goals.</p>
          </div>

          <div className="faq-item">
            <h4>How can I track who opened my emails?</h4>
            <p>Campaign analytics show open rates, reply rates, and other engagement metrics. Click on any campaign to view detailed statistics.</p>
          </div>

          <div className="faq-item">
            <h4>What's the difference between Starter and Professional?</h4>
            <p>Professional plan offers more emails (2,500 vs 500), more contacts (10,000 vs 1,000), more campaigns (20 vs 5), and priority support. It's ideal for agencies and growing businesses.</p>
          </div>

          <div className="faq-item">
            <h4>Is there a free trial for paid plans?</h4>
            <p>You can start with our Free plan to test the platform. There's no trial period for paid plans, but you can cancel anytime if you're not satisfied.</p>
          </div>
        </>
      )
    },
    {
      id: 'support',
      title: 'Support',
      icon: '🆘',
      content: (
        <>
          <h3>Getting Help & Support</h3>

          <h4>Contact Support:</h4>
          <div className="support-options">
            <div className="support-card">
              <h5>📧 Email Support</h5>
              <p>support@contactium.com</p>
              <p className="support-time">Response time: 24-48 hours</p>
            </div>

            <div className="support-card">
              <h5>💬 Live Chat</h5>
              <p>Coming soon</p>
              <p className="support-time">For Professional plan users</p>
            </div>

            <div className="support-card">
              <h5>📚 Knowledge Base</h5>
              <p>Browse this help documentation</p>
              <p className="support-time">Available 24/7</p>
            </div>
          </div>

          <h4>Before Contacting Support:</h4>
          <ul>
            <li>Check this Help documentation for answers</li>
            <li>Review the FAQ section</li>
            <li>Check your email settings and configuration</li>
            <li>Try refreshing the page or clearing your browser cache</li>
          </ul>

          <h4>When Contacting Support, Include:</h4>
          <ul>
            <li>Your account email</li>
            <li>Detailed description of the issue</li>
            <li>Steps to reproduce the problem</li>
            <li>Screenshots if applicable</li>
            <li>Browser and operating system information</li>
          </ul>

          <h4>Report a Bug:</h4>
          <p>Found a bug? Help us improve by reporting it to bugs@contactium.com with detailed information about what went wrong.</p>

          <h4>Feature Requests:</h4>
          <p>Have an idea for a new feature? We'd love to hear it! Send your suggestions to feedback@contactium.com</p>

          <div className="help-notice">
            <span className="notice-icon">ℹ️</span>
            <div>
              <strong>Support Priority:</strong> Professional plan users receive priority support with faster response times.
            </div>
          </div>
        </>
      )
    }
  ]

  const activeContent = sections.find(s => s.id === activeSection)

  return (
    <div className="page-container help-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Help & Documentation</h2>
          <p className="page-subtitle">Learn how to make the most of Contactium</p>
        </div>
        <button onClick={() => navigate('/')} className="secondary-btn">
          Back to Dashboard
        </button>
      </div>

      <div className="help-container">
        <aside className="help-sidebar">
          <div className="help-nav">
            <h3>Topics</h3>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`help-nav-item ${activeSection === section.id ? 'active' : ''}`}
              >
                <span className="help-nav-icon">{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="help-content">
          <div className="help-section">
            <div className="help-header">
              <span className="help-icon">{activeContent.icon}</span>
              <h2>{activeContent.title}</h2>
            </div>
            <div className="help-body">
              {activeContent.content}
            </div>
          </div>

          <div className="help-footer">
            <p>Can't find what you're looking for?</p>
            <button onClick={() => setActiveSection('support')} className="primary-btn">
              Contact Support
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
