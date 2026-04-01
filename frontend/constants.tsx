
import React from 'react';

export const LogoIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.093c-1.72.214-3.14.822-4.144 1.757A.75.75 0 008.25 9.093a5.999 5.999 0 013.743-1.48V6zM12 15.75a7.5 7.5 0 005.62-2.286.75.75 0 00-1.017-1.1c-.122.112-.25.22-.38.324a6 6 0 01-8.446 0 .75.75 0 00-1.042 1.083A7.5 7.5 0 0012 15.75z" clipRule="evenodd" />
  </svg>
);

export const WandIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 15.5l.75 3.75 3.75-.75 5.159-3.909a2.25 2.25 0 011.591-.659h5.714p-1.586-1.586A2.25 2.25 0 0018.75 9.75h-5.714a2.25 2.25 0 00-1.591.659L6 15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h.008v.008H6V3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21A2.25 2.25 0 011.5 18.75V16.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75A2.25 2.25 0 0118 1.5H16.5" />
  </svg>
);

export const CopyIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m9.375 0a9.06 9.06 0 00-1.5-.124M15 7.5a9.06 9.06 0 01-1.5.124" />
  </svg>
);

export const CheckIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const ClearIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12L12 14.25m-2.58-4.92l-6.375-6.375a1.125 1.125 0 00-1.591 1.591L4.828 10.5m11.256 11.256L21 21m-9-9l-6.375 6.375a1.125 1.125 0 01-1.591-1.591L10.172 12" />
  </svg>
);
