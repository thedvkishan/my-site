import type { SVGProps } from 'react';

export const TetherIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <circle cx="16" cy="16" r="16" fill="#32CD32" />
    <path fill="#fff" d="M19.34 11.69h-6.68v2.66h2v6.68h2.66v-6.68h2V11.69z" />
  </svg>
);
