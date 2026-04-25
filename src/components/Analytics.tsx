import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export default function Analytics() {
  return (
    <>
      {/* Google Analytics */}
      {gaId && <GoogleAnalytics gaId={gaId} />}

      {/* Microsoft Clarity */}
      {clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}
