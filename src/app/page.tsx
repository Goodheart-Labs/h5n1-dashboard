import { createIndex } from "@/lib/createIndex";
import { fetchKalshiData } from "@/lib/services/kalshi.server";
import { getManifoldHistoricalData } from "@/lib/services/manifold-historical.server";
import { downloadMetaculusData } from "@/lib/services/metaculus-download.server";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";
import { MobileFriendlyTooltip } from "@/components/MobileFriendlyTooltip";
import { LineGraph } from "@/components/LineGraph";
import { format } from "date-fns";
import { CustomTooltip } from "@/components/CustomTooltip";
import { GraphTitle } from "@/components/GraphTitle";
import Image from "next/image";
import { CSSProperties } from "react";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-static";

const HEIGHT = 17;

export default async function ServerRenderedPage() {
  const {
    indexData,
    manifoldHistoricalData,
    metWeaklyGeneralAI,
    turingTestData,
    fullAgiData,
    kalshiData,
  } = await getIndexData();

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)] text-foreground dark:bg-gray-900">
      <header className="mx-auto mb-8 w-full max-w-6xl text-center">
        <h1 className="my-4 text-2xl font-bold md:text-5xl">
          When will we achieve AGI?{" "}
          <MobileFriendlyTooltip>
            Artificial General Intelligence (AGI) demotes a highly competent
            computer system that can perform a broad set of human tasks.
            Definitions vary both as to the quality of performance (from median
            human to as good as the best humans) and the range (from most tasks
            to all tasks). The broad variety of definitions presents a problem
            for forecasts. This dashboard sidesteps this problem by taking the
            median of a set of predictions based on different definitions. See
            the FAQ for more.
          </MobileFriendlyTooltip>
        </h1>
        <p className="mb-4 min-h-[108px] text-2xl text-gray-700 dark:text-gray-300">
          {!indexData.data.length ? (
            "Loading timeline assessment..."
          ) : (
            <>
              <span className="mb-4 block text-4xl font-bold sm:text-6xl">
                {indexData.data[indexData.data.length - 1].value}
              </span>{" "}
              Our index estimates that Artificial General Intelligence will
              arrive in {indexData.data[indexData.data.length - 1].value} as of{" "}
              <span className="inline-flex items-center">
                {format(new Date(), "MMMM d, yyyy")}
                <MobileFriendlyTooltip>
                  The index is an average of predictions from Metaculus and
                  Manifold Markets. Metaculus is a forecasting community with a
                  strong track record, while Manifold Markets is a prediction
                  market platform. The index combines multiple definitions of
                  AGI to provide a more robust estimate.
                </MobileFriendlyTooltip>
              </span>
            </>
          )}
        </p>
      </header>

      {indexData && (
        <div className="mx-auto mb-6 w-full max-w-6xl space-y-6">
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="AGI Index"
              tooltipContent={
                <div className="space-y-2">
                  <p>This forecast is an average of the following forecasts:</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Date of &quot;weakly general AI&quot; - Metaculus</li>
                    <li>Date of &quot;general AI&quot; - Metaculus</li>
                    <li>When will AGI arrive? - Manifold</li>
                    <li>
                      Date of AI passing &quot;difficult Turing Test&quot; -
                      Metaculus
                    </li>
                    <li>AI passes Turing test before 2030? - Kalshi</li>
                  </ul>
                  <p>
                    For more detail, check the FAQ at the bottom of the page.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                An average of many different forecasts of AGI (shown below).
              </p>
            </GraphTitle>
            <div className="relative overflow-hidden">
              <div
                className="index-bar-container relative"
                style={{
                  height: 5 * HEIGHT,
                  marginLeft: 60,
                  marginRight: 16,
                }}
              >
                {[
                  {
                    name: "Metaculus (Weak AGI)",
                    startDate: indexData.startDates.weakAgi,
                    color: "#dc2626",
                  },
                  {
                    name: "Metaculus (Full AGI)",
                    startDate: indexData.startDates.fullAgi,
                    color: "#2563eb",
                  },
                  {
                    name: "Metaculus (Turing)",
                    startDate: indexData.startDates.turingTest,
                    color: "#16a34a",
                  },
                  {
                    name: "Manifold",
                    startDate: indexData.startDates.manifold,
                    color: "#9333ea",
                  },
                  {
                    name: "Kalshi",
                    startDate: indexData.startDates.kalshi,
                    color: "#ea580c",
                  },
                ]
                  .sort((a, b) => a.startDate - b.startDate)
                  .map((source, index) => {
                    const startDate = new Date(source.startDate);
                    const endDate = new Date();
                    const totalRange =
                      endDate.getTime() - new Date("2020-02-02").getTime();
                    const startOffset =
                      ((startDate.getTime() -
                        new Date("2020-02-02").getTime()) /
                        totalRange) *
                      100;

                    return (
                      <div
                        key={source.name}
                        className="index-bar absolute flex h-[17px] items-center pl-2"
                        style={
                          {
                            backgroundColor: source.color,
                            left: `${startOffset}%`,
                            right: 0,
                            top: index * HEIGHT,
                            "--color": source.color,
                          } as CSSProperties
                        }
                      >
                        <span className="text-[10px] font-medium text-white">
                          {source.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <LineGraph
                data={indexData.data}
                color="#64748b"
                label=""
                xAxisFormatter="MMM yyyy"
                yAxisProps={{
                  domain: [2024, 2100],
                }}
                tooltip={<CustomTooltip labelFormatter="MMM d, yyyy" />}
                lineProps={{
                  min: 2020,
                  max: 2130,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Included in index:
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title='Date of "weakly general AI" - Metaculus'
              sourceUrl="https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/"
              tooltipContent={
                <div className="space-y-2">
                  <p>A summary of Metaculus&apos; resolution criteria:</p>
                  <p>
                    For these purposes they define &quot;AI system&quot; as a
                    single unified software system that can satisfy the
                    following criteria, all easily completable by a typical
                    college-educated human:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      Able to reliably pass a Turing test of the type that would
                      win the Loebner Silver Prize
                    </li>
                    <li>
                      Able to score 90% or more on a robust version of the
                      Winograd Schema Challenge
                    </li>
                    <li>
                      Be able to score 75th percentile on all the full
                      mathematics section of a circa-2015-2020 standard SAT exam
                    </li>
                    <li>
                      Be able to learn the classic Atari game
                      &quot;Montezuma&apos;s revenge&quot; and explore all 24
                      rooms in under 100 hours of play
                    </li>
                  </ul>
                  <p>
                    The system must be integrated enough to explain its
                    reasoning and verbally report its progress across all tasks.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the forecasting site Metaculus, full title: &quot;When will
                the first weakly general AI system be devised, tested, and
                publicly announced?&quot;
              </p>
            </GraphTitle>

            <LineGraph
              data={metWeaklyGeneralAI?.datapoints || []}
              color="#dc2626"
              key="different-data"
              label="Metaculus Prediction (Year)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                scale: "log",
                domain: metWeaklyGeneralAI?.question
                  ? [
                      metWeaklyGeneralAI.question.scaling.range_min,
                      metWeaklyGeneralAI.question.scaling.range_max,
                    ]
                  : undefined,
              }}
              yAxisFormatter="ms:yyyy"
              tooltip={
                <CustomTooltip
                  formatter="ms:yyyy-MM-dd"
                  labelFormatter="MMM d, yyyy"
                />
              }
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title='Date of "general AI" - Metaculus'
              sourceUrl="https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/"
              tooltipContent={
                <div className="space-y-2">
                  <p>A summary of Metaculus&apos; resolution criteria:</p>
                  <p>
                    They define &quot;AI system&quot; as a single unified system
                    that can:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      Pass a 2-hour adversarial Turing test with text, images,
                      and audio
                    </li>
                    <li>
                      Assemble a complex model car from instructions
                      (demonstrating robotic capability)
                    </li>
                    <li>
                      Score 75%+ on every task and 90%+ mean accuracy across the
                      Hendrycks Q&A dataset
                    </li>
                    <li>
                      Achieve 90%+ accuracy on interview-level programming
                      problems
                    </li>
                  </ul>
                  <p>
                    The system must be truly unified - able to explain its
                    reasoning and describe its progress across all tasks.
                  </p>
                  <p>
                    Resolution will come via, direct demostration of such,
                    confident credible statements from developers or judgement
                    by a special panel composed by Metaculus.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the forecasting site Metaculus, full title: &quot;When will
                the first general AI system be devised, tested, and publicly
                announced?&quot;
              </p>
            </GraphTitle>
            <LineGraph
              data={fullAgiData ? fullAgiData.datapoints : []}
              color="#2563eb"
              label="Metaculus Prediction (Year)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                scale: "linear",
                domain: fullAgiData
                  ? [
                      fullAgiData.question.scaling.range_min,
                      fullAgiData.question.scaling.range_max,
                    ]
                  : undefined,
              }}
              yAxisFormatter="ms:yyyy"
              tooltip={
                <CustomTooltip
                  formatter="ms:yyyy-MM-dd"
                  labelFormatter="MMM d, yyyy"
                />
              }
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title='Date of AI passing "difficult Turing Test" - Metaculus'
              sourceUrl="https://www.metaculus.com/questions/11861/when-will-ai-pass-a-difficult-turing-test/"
              tooltipContent={
                <div className="space-y-2">
                  <p>A summary of Metaculus&apos; resolution criteria:</p>
                  <p>
                    The question resolves when an AI system passes a
                    high-quality Turing test that demonstrates extensive
                    knowledge, natural language mastery, common sense, and
                    human-level reasoning. The test must be:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      <strong>Long:</strong> At least 2 consecutive hours of
                      communication
                    </li>
                    <li>
                      <strong>Informed:</strong> Judges must have PhD-level
                      understanding of AI limitations, and confederates must
                      have PhD-level expertise in STEM
                    </li>
                    <li>
                      <strong>Adversarial:</strong> Judges actively try to
                      unmask the AI, confederates demonstrate their humanity
                    </li>
                    <li>
                      <strong>Passing criteria:</strong> At least 50% of judges
                      must rate the AI as more human than 33% of human
                      confederates
                    </li>
                  </ul>
                  <p>
                    All participants must understand their role is to ensure the
                    AI fails. Tests with cheating or conflicts of interest will
                    be excluded.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the forecasting site Metaculus, full title: &quot;When will
                an AI first pass a long, informed, adversarial Turing
                test?&quot;
              </p>
            </GraphTitle>
            <LineGraph
              data={turingTestData ? turingTestData.datapoints : []}
              color="#16a34a"
              label="Metaculus Prediction (Year)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                scale: "linear",
                domain: turingTestData
                  ? [
                      turingTestData.question.scaling.range_min,
                      turingTestData.question.scaling.range_max,
                    ]
                  : undefined,
              }}
              yAxisFormatter="ms:yyyy"
              tooltip={
                <CustomTooltip
                  formatter="ms:yyyy-MM-dd"
                  labelFormatter="MMM d, yyyy"
                />
              }
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="When will AGI arrive? (Manifold Markets Distribution)"
              sourceUrl="https://manifold.markets/ManifoldAI/agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708"
              tooltipContent={
                <div className="space-y-2">
                  <p>
                    The Manifold Markets question gives the following proposed
                    criteria:
                  </p>
                  <p>
                    &quot;For proposed testing criteria, refer to this Metaculus
                    Question by Matthew Barnett, or the Longbets wager between
                    Ray Kurzweil and Mitch Kapor.&quot;
                  </p>
                  <p>Our summary is there for that:</p>
                  <p>
                    This prediction resolves based on some high-quality Turing
                    test of which iether the Metaculus or Long Bets one would
                    probably be sufficient. This would likely involve a computer
                    system demonstrating human-like intelligence through
                    extended text-based conversations with expert judges who are
                    actively trying to identify the AI.
                  </p>
                  <p>
                    The test would require the AI to demonstrate natural
                    language understanding, reasoning, knowledge across domains,
                    and the ability to respond coherently to unexpected
                    questions. Resolution would occur when a credible
                    organization or panel confirms that an AI has successfully
                    passed such a test, fooling a significant portion of
                    qualified judges into believing it&apos;s human, while
                    demonstrating capabilities consistent with general
                    intelligence rather than narrow expertise.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the prediction market Manifold Markets, full title:
                &quot;AGI When? [High Quality Turing Test]&quot;
              </p>
            </GraphTitle>
            {manifoldHistoricalData && (
              <LineGraph
                data={manifoldHistoricalData.data}
                color="#9333ea"
                label="Manifold Prediction (Year)"
                xAxisFormatter="MMM yyyy"
                yAxisProps={{
                  domain: [2020, 2055],
                }}
                tooltip={<CustomTooltip labelFormatter="MMM d, yyyy" />}
              />
            )}
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="AI passes Turing test before 2030?"
              sourceUrl="https://kalshi.com/markets/kxaituring/ai-turing-test"
              tooltipContent={
                <div className="space-y-2">
                  <p>The Kalshi prediction market rules read:</p>
                  <p>
                    &quot;If Kurzweil has won his bet that AI will pass the
                    Turing Test by December 31, 2029, then the market resolves
                    to Yes. Outcome verified from{" "}
                    <a
                      href="https://longbets.org/1/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Long Bets Foundation
                    </a>
                    .&quot;
                  </p>
                  <p>A summary of the rules of that bet:</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      <strong>Format:</strong> 2-hour text-based interviews
                      between judges and participants
                    </li>
                    <li>
                      <strong>Participants:</strong> 3 human judges, 3 human
                      foils, and 1 computer
                    </li>
                    <li>
                      <strong>Test structure:</strong> Each judge interviews all
                      4 participants (3 humans, 1 computer)
                    </li>
                    <li>
                      <strong>Passing criteria:</strong> Computer must (1) fool
                      at least 2 of 3 judges into thinking it&apos;s human AND
                      (2) be ranked equal to or more human than at least 2 of
                      the 3 human foils
                    </li>
                  </ul>
                  <p>
                    This famous bet between Ray Kurzweil and Mitchell Kapor
                    resolves in 2029, with Kurzweil betting that a computer will
                    pass the test by then.
                  </p>
                </div>
              }
            />
            <LineGraph
              data={kalshiData}
              color="#ea580c"
              label="Kalshi Prediction (%)"
              xAxisFormatter="MMM d"
              yAxisProps={{
                domain: [60, 80],
              }}
              tooltip={<CustomTooltip labelFormatter="MMM d, yyyy" />}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-8 w-full max-w-6xl text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-8 mt-8 rounded-lg bg-white p-6 text-left shadow-lg dark:bg-gray-800">
          <h3 className="mb-6 text-2xl font-semibold">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  Why no specific definition of AGI?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    There is significant disagreement about what constitutes
                    AGI. Rather than pick one definition, we aggregate
                    predictions across different definitions to capture the
                    broader expert consensus on transformative AI timelines.
                  </p>
                  <p>
                    It is always going to be possible to argue that the set of
                    averaged definitions is incorrectly weighted. To reduce
                    biase I seek to accept all, long-term, repeating forecasts
                    of AGI and then weight them equally. Perhaps we will
                    down-weight some if some if a single institution releases
                    many different AI forecasts
                  </p>
                  <p>
                    If you disagree, please get in touch. If you know of some
                    other repeating forecast of AGI that I have not included,
                    let me know.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  How is the AGI index calculated?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    Mostly the index is a straight average of each different
                    source. There is one deviation and some clarifications.
                  </p>
                  <p>
                    First, the Kalshi prediction. All the the other predictions
                    are date predictions—forecasters were able to give their
                    whole range of predictions. But the Kalshi prediction is a
                    binary prediction—will the AI pass the Turing test before
                    2030? It can only be answered with a yes or no.
                  </p>
                  <p>
                    So I took the average of the other predictions, and then
                    adjusted the weights of that prediction before and after
                    2030 to make them match the Kalshi prediction. This formula
                    is as follows:
                  </p>
                  <p className="whitespace-pre-wrap font-mono text-sm">
                    P(AGI on date Xi, before 2030) = (average of all other
                    predictions for date Xi / average of the sum of predictions
                    on date Xi) * Kalshi P(AGI before 2030)
                  </p>
                  <p>
                    And then the index is the average of all Xi values,
                    including this new one for Kalshi.
                  </p>
                  <p>
                    If you want a longer explanation, I&apos;ve tried putting
                    this into claude and it seems to understand and be able to
                    answer questions. So literaly copy the above block.
                  </p>
                  <p>
                    As for the clarifications:
                    <ul>
                      <li>
                        The Manifold prediction has a 2050 end date. There is a
                        moderate bump in probability in this bucket. This should
                        probably be clarified to mean that any time after 2049
                        resolves to the 2050 bucket, since that seeems to be
                        what people have understood it to mean. There isn&apos;t
                        much probability in the bucket so we have ignored this,
                        but we could return to it.
                      </li>
                      <li>
                        The date precitions have different buckets. I can&apos;t
                        remember what we did with them but I guess we averaged
                        across buckets. This is plausibly less accurate than
                        fitting them to a curve and using that to do a weighted
                        average, but we&apos;re using it for medians, 10th and
                        90th percentiles. I doubt it makes much difference.
                      </li>
                    </ul>
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="group flex w-full items-center justify-between p-4 text-left">
                <h4 className="text-lg font-medium">
                  What does this mean for me?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    This site isn&apos;t here to tell you what to do about
                    Artificial General Intelligence. But seeing our prediction
                    of when it will arrive could cause you to make different
                    choices.
                  </p>
                  <p>
                    Whatever the current date is, that&apos;s my, Nathan
                    Young&apos;s, best consensus guess at roughly when computers
                    will do human work. I think that this world will be a
                    strange one and that it&apos;s worth preparing both
                    practically and emotionally.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        </div>

        <div className="mb-1 text-center">
          <a
            href="https://github.com/Goodheart-Labs/agi-timelines-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            View the source code on GitHub
          </a>
        </div>
        <div className="mb-1 text-gray-600 dark:text-gray-300">
          If you want to support more work like this,{" "}
          <a
            href="https://nathanpmyoung.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            buy a paid subscription to Predictive Text
          </a>
        </div>

        <div className="mb-1">
          Built by&nbsp;
          <span className="inline-flex items-center gap-2">
            <a
              href="https://x.com/NathanpmYoung"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Nathan Young
              <Image
                src="https://unavatar.io/twitter/NathanpmYoung"
                alt="Nathan Young"
                className="rounded-full"
                width={24}
                height={24}
              />
            </a>
          </span>
          <span>&nbsp;and&nbsp;</span>
          <span className="inline-flex items-center">
            <a
              href="https://x.com/tone_row_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Rob Gordon
              <Image
                src="https://unavatar.io/twitter/tone_row_"
                alt="Rob Gordon"
                className="rounded-full"
                width={24}
                height={24}
              />
            </a>
            <span>&nbsp;of&nbsp;</span>
            <a
              href="https://goodheartlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Goodheart Labs
            </a>
          </span>
        </div>

        <span>&nbsp;</span>
      </footer>
    </div>
  );
}

async function getIndexData() {
  const [
    fullAgiData,
    metWeaklyGeneralAI,
    turingTestData,
    manifoldHistoricalData,
    kalshiData,
  ] = await Promise.allSettled([
    downloadMetaculusData(5121),
    downloadMetaculusData(3479),
    downloadMetaculusData(11861),
    getManifoldHistoricalData(
      "agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708",
    ),
    fetchKalshiData({
      seriesTicker: "KXAITURING",
      marketTicker: "AITURING",
      marketId: "8a66420d-4b3c-446b-bd62-8386637ad844",
      period_interval: 24 * 60,
    }),
  ]);

  let indexData: null | {
    data: Awaited<ReturnType<typeof createIndex>>["data"];
    startDates: Awaited<ReturnType<typeof createIndex>>["startDates"];
  } = null;

  if (
    metWeaklyGeneralAI.status === "fulfilled" &&
    fullAgiData.status === "fulfilled" &&
    turingTestData.status === "fulfilled" &&
    manifoldHistoricalData.status === "fulfilled" &&
    kalshiData.status === "fulfilled"
  ) {
    indexData = createIndex(
      metWeaklyGeneralAI.value,
      fullAgiData.value,
      turingTestData.value,
      manifoldHistoricalData.value,
      kalshiData.value,
    );

    return {
      indexData,
      metWeaklyGeneralAI: metWeaklyGeneralAI.value,
      fullAgiData: fullAgiData.value,
      turingTestData: turingTestData.value,
      manifoldHistoricalData: manifoldHistoricalData.value,
      kalshiData: kalshiData.value,
    };
  }

  // Show which ones failed
  const failures = {
    metWeaklyGeneralAI:
      metWeaklyGeneralAI.status === "rejected"
        ? metWeaklyGeneralAI.reason
        : null,
    fullAgiData: fullAgiData.status === "rejected" ? fullAgiData.reason : null,
    manifoldHistoricalData:
      manifoldHistoricalData.status === "rejected"
        ? manifoldHistoricalData.reason
        : null,
  };

  console.error(`Error fetching data: ${JSON.stringify(failures)}`);

  throw new Error(`Error fetching data: ${JSON.stringify(failures)}`);
}
