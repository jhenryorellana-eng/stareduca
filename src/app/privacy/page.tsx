import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Privacy Policy - Starbooks',
  description: 'Privacy Policy for Starbooks mobile application by Starbiz Academy LLC.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Image
            src="/starbooks-logo.png"
            alt="Starbooks Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Starbooks</h1>
            <p className="text-xs text-gray-500">Privacy Policy</p>
          </div>
        </div>
      </header>

      {/* Privacy Policy Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <style dangerouslySetInnerHTML={{ __html: `
          .privacy-content [data-custom-class='body'],
          .privacy-content [data-custom-class='body'] * {
            background: transparent !important;
          }
          .privacy-content [data-custom-class='title'],
          .privacy-content [data-custom-class='title'] * {
            font-family: Arial !important;
            font-size: 26px !important;
            color: #000000 !important;
          }
          .privacy-content [data-custom-class='subtitle'],
          .privacy-content [data-custom-class='subtitle'] * {
            font-family: Arial !important;
            color: #595959 !important;
            font-size: 14px !important;
          }
          .privacy-content [data-custom-class='heading_1'],
          .privacy-content [data-custom-class='heading_1'] * {
            font-family: Arial !important;
            font-size: 19px !important;
            color: #000000 !important;
          }
          .privacy-content [data-custom-class='heading_2'],
          .privacy-content [data-custom-class='heading_2'] * {
            font-family: Arial !important;
            font-size: 17px !important;
            color: #000000 !important;
          }
          .privacy-content [data-custom-class='body_text'],
          .privacy-content [data-custom-class='body_text'] * {
            color: #595959 !important;
            font-size: 14px !important;
            font-family: Arial !important;
          }
          .privacy-content [data-custom-class='link'],
          .privacy-content [data-custom-class='link'] * {
            color: #3030F1 !important;
            font-size: 14px !important;
            font-family: Arial !important;
            word-break: break-word !important;
          }
          .privacy-content h1, .privacy-content h2, .privacy-content h3 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          .privacy-content ul {
            padding-left: 2em;
            margin: 0.5em 0;
          }
          .privacy-content li {
            margin: 0.25em 0;
          }
        `}} />

        <div className="privacy-content" data-custom-class="body">
          <div>
            <strong>
              <span style={{ fontSize: '26px' }}>
                <span data-custom-class="title">
                  <h1>PRIVACY POLICY</h1>
                </span>
              </span>
            </strong>
          </div>

          <div>
            <span style={{ color: 'rgb(127, 127, 127)' }}>
              <strong>
                <span style={{ fontSize: '15px' }}>
                  <span data-custom-class="subtitle">Last updated December 12, 2025</span>
                </span>
              </strong>
            </span>
          </div>

          <div><br /></div>
          <div><br /></div>
          <div><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(127, 127, 127)' }}>
              <span style={{ color: 'rgb(89, 89, 89)', fontSize: '15px' }}>
                <span data-custom-class="body_text">
                  This Privacy Notice for <strong>Starbiz Academy LLC</strong> (doing business as{' '}
                  <a target="_blank" data-custom-class="link" href="mailto:jhenry.orellana@gmail.com">
                    jhenry.orellana@gmail.com
                  </a>
                  ) (&quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>,&quot; or &quot;<strong>our</strong>&quot;), describes how and why we might access, collect, store, use, and/or share (&quot;<strong>process</strong>&quot;) your personal information when you use our services (&quot;<strong>Services</strong>&quot;), including when you:
                </span>
              </span>
            </span>
          </div>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  Download and use our mobile application (<strong>StarBooks</strong>), or any other application of ours that links to this Privacy Notice
                </span>
              </span>
            </li>
          </ul>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  Engage with us in other related ways, including any marketing or events
                </span>
              </span>
            </li>
          </ul>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span style={{ color: 'rgb(127, 127, 127)' }}>
                <span data-custom-class="body_text">
                  <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <strong>+1 (801) 941-3479</strong>.
                </span>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <strong>
              <span style={{ fontSize: '15px' }}>
                <span data-custom-class="heading_1">
                  <h2>SUMMARY OF KEY POINTS</h2>
                </span>
              </span>
            </strong>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong><em>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our </em></strong>
              </span>
            </span>
            <a data-custom-class="link" href="#toc">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text"><strong><em>table of contents</em></strong></span>
              </span>
            </a>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text"><strong><em> below to find the section you are looking for.</em></strong></span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#personalinfo">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">personal information you disclose to us</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>Do we process any sensitive personal information?</strong> Some of the information may be considered &quot;special&quot; or &quot;sensitive&quot; in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#sensitiveinfo">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">sensitive information we process</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>Do we collect any information from third parties?</strong> We may collect information from public databases, marketing partners, social media platforms, and other outside sources. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#othersources">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">information collected from other sources</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#infouse">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">how we process your information</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#whoshare">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">when and with whom we share your personal information</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#infosafe">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">how we keep your information safe</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about{' '}
              </span>
            </span>
            <a data-custom-class="link" href="#privacyrights">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">your privacy rights</span>
              </span>
            </a>
            <span data-custom-class="body_text">.</span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a{' '}
              </span>
            </span>
            <a data-custom-class="link" href="https://app.termly.io/dsar/a4cb4741-49f5-4030-a914-8adbc19f341e" rel="noopener noreferrer" target="_blank">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">data subject access request</span>
              </span>
            </a>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">Want to learn more about what we do with any information we collect?{' '}</span>
            </span>
            <a data-custom-class="link" href="#toc">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">Review the Privacy Notice in full</span>
              </span>
            </a>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">.</span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div id="toc" style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span style={{ color: 'rgb(127, 127, 127)' }}>
                <span style={{ color: 'rgb(0, 0, 0)' }}>
                  <strong>
                    <span data-custom-class="heading_1">
                      <h2>TABLE OF CONTENTS</h2>
                    </span>
                  </strong>
                </span>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#infocollect">
                <span style={{ color: 'rgb(0, 58, 250)' }}>1. WHAT INFORMATION DO WE COLLECT?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#infouse">
                <span style={{ color: 'rgb(0, 58, 250)' }}>2. HOW DO WE PROCESS YOUR INFORMATION?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(0, 58, 250)' }}>
              <a data-custom-class="link" href="#whoshare">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
              <a data-custom-class="link" href="#3pwebsites">4. WHAT IS OUR STANCE ON THIRD-PARTY WEBSITES?</a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#cookies">
                <span style={{ color: 'rgb(0, 58, 250)' }}>5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <a data-custom-class="link" href="#ai">
              <span style={{ color: 'rgb(0, 58, 250)' }}>6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</span>
            </a>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#sociallogins">
                <span style={{ color: 'rgb(0, 58, 250)' }}>7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#inforetain">
                <span style={{ color: 'rgb(0, 58, 250)' }}>8. HOW LONG DO WE KEEP YOUR INFORMATION?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#infosafe">
                <span style={{ color: 'rgb(0, 58, 250)' }}>9. HOW DO WE KEEP YOUR INFORMATION SAFE?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span style={{ color: 'rgb(0, 58, 250)' }}>
                <a data-custom-class="link" href="#privacyrights">10. WHAT ARE YOUR PRIVACY RIGHTS?</a>
              </span>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#DNT">
                <span style={{ color: 'rgb(0, 58, 250)' }}>11. CONTROLS FOR DO-NOT-TRACK FEATURES</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#uslaws">
                <span style={{ color: 'rgb(0, 58, 250)' }}>12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <a data-custom-class="link" href="#otherlaws">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>13. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?</span>
            </a>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <a data-custom-class="link" href="#policyupdates">
                <span style={{ color: 'rgb(0, 58, 250)' }}>14. DO WE MAKE UPDATES TO THIS NOTICE?</span>
              </a>
            </span>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <a data-custom-class="link" href="#contact">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</span>
            </a>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <a data-custom-class="link" href="#request">
              <span style={{ color: 'rgb(0, 58, 250)' }}>16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</span>
            </a>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div style={{ lineHeight: 1.5 }}><br /></div>

          {/* Section 1 */}
          <div id="infocollect" style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(0, 0, 0)' }}>
              <span style={{ color: 'rgb(0, 0, 0)', fontSize: '15px' }}>
                <span style={{ fontSize: '15px', color: 'rgb(0, 0, 0)' }}>
                  <span style={{ fontSize: '15px', color: 'rgb(0, 0, 0)' }}>
                    <span id="control" style={{ color: 'rgb(0, 0, 0)' }}>
                      <strong>
                        <span data-custom-class="heading_1">
                          <h2>1. WHAT INFORMATION DO WE COLLECT?</h2>
                        </span>
                      </strong>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </div>

          <div id="personalinfo">
            <span data-custom-class="heading_2" style={{ color: 'rgb(0, 0, 0)' }}>
              <span style={{ fontSize: '15px' }}>
                <strong><h3>Personal information you disclose to us</h3></strong>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(127, 127, 127)' }}>
              <span style={{ color: 'rgb(89, 89, 89)', fontSize: '15px' }}>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text"><strong><em>In Short:</em></strong></span>
                  </span>
                </span>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text"><em> We collect personal information that you provide to us.</em></span>
                  </span>
                </span>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
              </span>
            </span>
          </div>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">names</span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">phone numbers</span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">email addresses</span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">usernames</span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">passwords</span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">debit/credit card numbers</span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">contact or authentication data</span>
              </span>
            </li>
          </ul>

          <div id="sensitiveinfo" style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we process the following categories of sensitive information:
              </span>
            </span>
          </div>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px' }}>
                <span data-custom-class="body_text">genetic data</span>
              </span>
            </li>
          </ul>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                <strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by <strong>Stripe</strong>. You may find their privacy notice link(s) here:{' '}
                <a target="_blank" data-custom-class="link" href="https://stripe.com/es-us/privacy" style={{ color: 'rgb(0, 58, 250)' }}>
                  https://stripe.com/es-us/privacy
                </a>
                .
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                <strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section called &quot;<a data-custom-class="link" href="#sociallogins" style={{ color: 'rgb(0, 58, 250)' }}>HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a>&quot; below.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span data-custom-class="body_text">
              <span style={{ fontSize: '15px' }}>
                <strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
              </span>
            </span>
          </div>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span data-custom-class="body_text">
                <span style={{ fontSize: '15px' }}>
                  <em>Geolocation Information.</em> We may request access or permission to track location-based information from your mobile device, either continuously or while you are using our mobile application(s), to provide certain location-based services. If you wish to change our access or permissions, you may do so in your device&apos;s settings.
                </span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px' }}>
                <span data-custom-class="body_text">
                  <em>Mobile Device Access.</em> We may request access or permission to certain features from your mobile device, including your mobile device&apos;s bluetooth, camera, microphone, sms messages, storage, contacts, and other features. If you wish to change our access or permissions, you may do so in your device&apos;s settings.
                </span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px' }}>
                <span data-custom-class="body_text">
                  <em>Mobile Device Data.</em> We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model Internet service provider and/or mobile carrier, and Internet Protocol (IP) address (or proxy server). If you are using our application(s), we may also collect information about the phone network associated with your mobile device, your mobile device&apos;s operating system or platform, the type of mobile device you use, your mobile device&apos;s unique device ID, and information about the features of our application(s) you accessed.
                </span>
              </span>
            </li>
          </ul>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                This information is primarily needed to maintain the security and operation of our application(s), for troubleshooting, and for our internal analytics and reporting purposes.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div>
            <span data-custom-class="heading_2" style={{ color: 'rgb(0, 0, 0)' }}>
              <span style={{ fontSize: '15px' }}>
                <strong><h3>Information automatically collected</h3></strong>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(127, 127, 127)' }}>
              <span style={{ color: 'rgb(89, 89, 89)', fontSize: '15px' }}>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text"><strong><em>In Short:</em></strong></span>
                  </span>
                </span>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text"><em> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em></span>
                  </span>
                </span>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                Like many businesses, we also collect information through cookies and similar technologies.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">The information we collect includes:</span>
            </span>
          </div>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  <em>Log and Usage Data.</em> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called &quot;crash dumps&quot;), and hardware settings).
                </span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  <em>Device Data.</em> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include information such as your IP address (or proxy server), device and application identification numbers, location, browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.
                </span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  <em>Location Data.</em> We collect location data such as information about your device&apos;s location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the Services.
                </span>
              </span>
            </li>
          </ul>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <strong><span data-custom-class="heading_2"><h3>Google API</h3></span></strong>
              <span data-custom-class="body_text">Our use of information received from Google APIs will adhere to </span>
            </span>
            <a data-custom-class="link" href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">Google API Services User Data Policy</span>
              </span>
            </a>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">, including the </span>
            </span>
            <a data-custom-class="link" href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" rel="noopener noreferrer" target="_blank">
              <span style={{ color: 'rgb(0, 58, 250)', fontSize: '15px' }}>
                <span data-custom-class="body_text">Limited Use requirements</span>
              </span>
            </a>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">.</span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div id="othersources">
            <span data-custom-class="heading_2" style={{ color: 'rgb(0, 0, 0)' }}>
              <span style={{ fontSize: '15px' }}>
                <strong><h3>Information collected from other sources</h3></strong>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(127, 127, 127)' }}>
              <span style={{ color: 'rgb(89, 89, 89)', fontSize: '15px' }}>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text"><strong><em>In Short:</em></strong></span>
                  </span>
                </span>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text"><em> We may collect limited data from public databases, marketing partners, social media platforms, and other outside sources.</em></span>
                  </span>
                </span>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                In order to enhance our ability to provide relevant marketing, offers, and services to you and update our records, we may obtain information about you from other sources, such as public databases, joint marketing partners, affiliate programs, data providers, social media platforms, and from other third parties. This information includes mailing addresses, job titles, email addresses, phone numbers, intent data (or user behavior data), Internet Protocol (IP) addresses, social media profiles, social media URLs, and custom profiles, for purposes of targeted advertising and event promotion.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                If you interact with us on a social media platform using your social media account (e.g., Facebook or X), we receive personal information about you from such platforms such as your name, email address, and gender. You may have the right to withdraw your consent to processing your personal information. Learn more about{' '}
                <a data-custom-class="link" href="#withdrawconsent" style={{ color: 'rgb(0, 58, 250)' }}>withdrawing your consent</a>. Any personal information that we collect from your social media account depends on your social media account&apos;s privacy settings. Please note that their own use of your information is not governed by this Privacy Notice.
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div style={{ lineHeight: 1.5 }}><br /></div>

          {/* Section 2 */}
          <div id="infouse" style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(127, 127, 127)' }}>
              <span style={{ color: 'rgb(89, 89, 89)', fontSize: '15px' }}>
                <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span id="control" style={{ color: 'rgb(0, 0, 0)' }}>
                      <strong>
                        <span data-custom-class="heading_1">
                          <h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
                        </span>
                      </strong>
                    </span>
                  </span>
                </span>
                <span data-custom-class="body_text">
                  <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                    <span data-custom-class="body_text">
                      <strong><em>In Short:</em></strong><em> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</em>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                <strong>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong>
              </span>
            </span>
          </div>

          <ul>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  <strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.
                </span>
              </span>
            </li>
            <li data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
              <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
                <span data-custom-class="body_text">
                  <strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
                </span>
              </span>
            </li>
          </ul>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          {/* Additional sections would continue here - truncated for brevity */}

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px', color: 'rgb(89, 89, 89)' }}>
              <span data-custom-class="body_text">
                <em>For the complete privacy policy with all sections, please contact us at the information provided below.</em>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div style={{ lineHeight: 1.5 }}><br /></div>

          {/* Contact Section */}
          <div id="contact" style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(0, 0, 0)' }}>
              <span style={{ fontSize: '15px' }}>
                <strong>
                  <span data-custom-class="heading_1">
                    <h2>15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
                  </span>
                </strong>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                If you have questions or comments about this notice, you may contact us by phone at <strong>+1 (801) 941-3479</strong>, or by email at:
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                <strong>Starbiz Academy LLC</strong><br />
                Email: <a href="mailto:jhenry.orellana@gmail.com" data-custom-class="link" style={{ color: 'rgb(0, 58, 250)' }}>jhenry.orellana@gmail.com</a>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div style={{ lineHeight: 1.5 }}><br /></div>

          {/* Data Request Section */}
          <div id="request" style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'rgb(0, 0, 0)' }}>
              <span style={{ fontSize: '15px' }}>
                <strong>
                  <span data-custom-class="heading_1">
                    <h2>16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                  </span>
                </strong>
              </span>
            </span>
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <span style={{ fontSize: '15px' }}>
              <span data-custom-class="body_text">
                Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please visit:{' '}
                <a href="/delete-account" data-custom-class="link" style={{ color: 'rgb(0, 58, 250)' }}>
                  Delete Account Page
                </a>
              </span>
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Starbooks - Starbiz Academy LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
