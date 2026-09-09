"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";

function Item({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
      <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
        <h4 className="text-lg font-medium">{question}</h4>
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
        <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
          {children}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function Faq() {
  return (
    <div className="space-y-4">
      <Item question="Why did the dashboard stop tracking?">
        <p>
          The three inputs to the index all resolved at the end of 2025. US
          human cases stayed in the dozens rather than reaching 10,000, and the
          CDC never advised against travel. The markets closed, and Kalshi and
          Metaculus no longer serve their price history through their APIs.
        </p>
        <p>
          What you see above is what the Wayback Machine captured of this
          site&apos;s own data feeds between 8 January and 8 February 2025,
          rebuilt with the original formula. The raw captures are downloadable
          below.
        </p>
      </Item>
      <Item question="How was the risk index calculated?">
        <p>
          We had three individual data sources that related to whether bird flu
          would be bad, but even if they all resolved positive, we might only
          have had something like winter flu.
        </p>
        <p>
          As a result I, Nathan Young, used my professional judgement as a
          forecaster to assign a conditional probability to each data source
          that if it resolved positive, the actual central question did.
        </p>
        <p className="font-mono text-sm">
          ie P(bird flu as bad as covid) = P(bird flu as bad as covid | 10,000
          US cases) x P(10,000 US cases)
        </p>
        <p>We had three of these, and took the average.</p>
        <p className="whitespace-pre-wrap font-mono text-sm">
          Index = ( 0.5 × Metaculus P(10,000 US cases) + 0.5 × Kalshi P(10,000
          US cases) + 0.1 × Kalshi P(CDC travel advisory) ) ÷ 3
        </p>
        <p>
          I may be wrong here, but I really do not think a straight or weighted
          average is the right answer. I agree that I should take some group
          median on these made up values.
        </p>
      </Item>
      <Item question="Will it come back?">
        <p>
          If bird flu returns to the markets with enough depth to build an index
          from, yes. Until then the open markets listed above are the honest
          substitute: they are shown as they are, not combined.
        </p>
      </Item>
    </div>
  );
}
