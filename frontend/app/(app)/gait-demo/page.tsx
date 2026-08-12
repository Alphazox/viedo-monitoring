'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice, PreviewBanner } from '@/components/ui/feedback';
import { AI_SERVICE_URL, AiServiceApiError, alertsApi, type Alert } from '@/lib/api/aiServiceClient';
import { gaitApi } from '@/lib/api/gaitClient';
import type { GaitDemoResult, GaitSubject, GaitVisualizeResult, GaitWatchResult } from '@/lib/api/gaitClient';
import { activityApi } from '@/lib/api/activityClient';
import type { ActivityDemoResult, ActivityResult, CombinedDemoResult } from '@/lib/api/activityClient';
import { detectionApi } from '@/lib/api/detectionClient';
import type { AnnotateResult } from '@/lib/api/detectionClient';

const FILE_INPUT_CLASSES =
  'block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function demoVideoUrl(filename: string): string {
  return `${AI_SERVICE_URL}/demo-videos/${filename}`;
}

function DemoVideo({ filename, label }: { filename: string; label: string }) {
  return (
    <video
      key={filename}
      controls
      muted
      className="mt-2 w-full max-w-xs rounded-md bg-black"
      aria-label={label}
    >
      <source src={demoVideoUrl(filename)} type="video/mp4" />
    </video>
  );
}

function SeverityBadge({ severity }: { severity: 'warning' | 'critical' }) {
  return <Badge tone={severity === 'critical' ? 'red' : 'amber'}>{severity}</Badge>;
}

function AlertOutcome({ alert, negativeLabel }: { alert: Alert | null; negativeLabel: string }) {
  return alert ? <SeverityBadge severity={alert.severity} /> : <Badge tone="gray">{negativeLabel}</Badge>;
}

function ActivityAnalysisSummary({ result }: { result: ActivityResult }) {
  const { analysis } = result;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/50">
      <span className="text-slate-700 dark:text-slate-300">
        {analysis.isNight ? 'Night' : 'Day'} (brightness {analysis.meanBrightness})
      </span>
      <span className="text-slate-700 dark:text-slate-300">
        {analysis.loitered ? `Loitered (${analysis.dwellFrames} frames near entrance)` : 'Did not loiter'}
      </span>
      <AlertOutcome alert={result.alert} negativeLabel="No alert" />
    </div>
  );
}

export default function GaitDemoPage() {
  const [subjects, setSubjects] = useState<GaitSubject[] | null>(null);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<GaitDemoResult | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [enrollLabel, setEnrollLabel] = useState('');
  const [enrollWatchlisted, setEnrollWatchlisted] = useState(false);
  const [enrollFile, setEnrollFile] = useState<File | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const [watchFile, setWatchFile] = useState<File | null>(null);
  const [watching, setWatching] = useState(false);
  const [watchResult, setWatchResult] = useState<GaitWatchResult | null>(null);

  const [activityDemoRunning, setActivityDemoRunning] = useState(false);
  const [activityDemoResult, setActivityDemoResult] = useState<ActivityDemoResult | null>(null);

  const [combinedRunning, setCombinedRunning] = useState(false);
  const [combinedResult, setCombinedResult] = useState<CombinedDemoResult | null>(null);

  const [annotateFile, setAnnotateFile] = useState<File | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const [annotateResult, setAnnotateResult] = useState<AnnotateResult | null>(null);

  const [visualizeFile, setVisualizeFile] = useState<File | null>(null);
  const [visualizing, setVisualizing] = useState(false);
  const [visualizeResult, setVisualizeResult] = useState<GaitVisualizeResult | null>(null);
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<ActivityResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [galleryRes, alertsRes] = await Promise.all([gaitApi.gallery(), alertsApi.list()]);
      setSubjects(galleryRes.subjects);
      setAlerts(alertsRes.alerts);
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to load demo data.');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    refresh();
  }, [refresh]);

  async function handleRunDemo() {
    setError(null);
    setDemoRunning(true);
    setDemoResult(null);
    try {
      const result = await gaitApi.runDemo();
      setDemoResult(result);
      await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to run the demo.');
    } finally {
      setDemoRunning(false);
    }
  }

  async function handleSeedGallery() {
    setError(null);
    setSeeding(true);
    try {
      await gaitApi.seedGallery();
      await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to seed the gallery.');
    } finally {
      setSeeding(false);
    }
  }

  async function handleEnroll(event: FormEvent) {
    event.preventDefault();
    if (!enrollFile || !enrollLabel.trim()) return;
    setError(null);
    setEnrolling(true);
    try {
      await gaitApi.enroll(enrollLabel.trim(), enrollWatchlisted, enrollFile);
      setEnrollLabel('');
      setEnrollWatchlisted(false);
      setEnrollFile(null);
      await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to enroll subject.');
    } finally {
      setEnrolling(false);
    }
  }

  async function handleWatch(event: FormEvent) {
    event.preventDefault();
    if (!watchFile) return;
    setError(null);
    setWatching(true);
    setWatchResult(null);
    try {
      const result = await gaitApi.watch(watchFile);
      setWatchResult(result);
      if (result.alert) await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to run watch.');
    } finally {
      setWatching(false);
    }
  }

  async function handleRunActivityDemo() {
    setError(null);
    setActivityDemoRunning(true);
    setActivityDemoResult(null);
    try {
      const result = await activityApi.runDemo();
      setActivityDemoResult(result);
      await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to run the activity demo.');
    } finally {
      setActivityDemoRunning(false);
    }
  }

  async function handleRunCombinedDemo() {
    setError(null);
    setCombinedRunning(true);
    setCombinedResult(null);
    try {
      const result = await activityApi.runCombinedDemo();
      setCombinedResult(result);
      await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to run the combined demo.');
    } finally {
      setCombinedRunning(false);
    }
  }

  async function handleAnnotate(event: FormEvent) {
    event.preventDefault();
    if (!annotateFile) return;
    setError(null);
    setAnnotating(true);
    setAnnotateResult(null);
    try {
      const result = await detectionApi.annotate(annotateFile);
      setAnnotateResult(result);
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to run detection.');
    } finally {
      setAnnotating(false);
    }
  }

  async function handleVisualize(event: FormEvent) {
    event.preventDefault();
    if (!visualizeFile) return;
    setError(null);
    setVisualizing(true);
    setVisualizeResult(null);
    try {
      const result = await gaitApi.visualize(visualizeFile);
      setVisualizeResult(result);
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to visualize gait extraction.');
    } finally {
      setVisualizing(false);
    }
  }

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (!analyzeFile) return;
    setError(null);
    setAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const result = await activityApi.analyze(analyzeFile);
      setAnalyzeResult(result);
      if (result.alert) await refresh();
    } catch (err) {
      setError(err instanceof AiServiceApiError ? err.message : 'Failed to analyze clip.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Detection Demo"
        description="Gait re-identification (YOLOv8 person detection + DeepSORT tracking + OpenCV Gait Energy Image + PyTorch CNN) and a suspicious-activity heuristic (after-hours + loitering near an entrance), both feeding one alert feed."
      />

      <PreviewBanner>
        Standalone demo talking directly to ai-service (not the production API gateway). Real footage of a real
        person is run through a pretrained YOLOv8 detector + DeepSORT tracker to isolate the subject before gait/
        activity analysis; this repo&apos;s own synthetic self-test clips (below) don&apos;t look like people to a
        real detector, so those fall back to the original whole-frame background-subtraction heuristic instead —
        both paths feed the same pipeline downstream. The gait CNN ships with fixed, untrained weights — no real
        gait dataset was available — so it proves the pipeline end-to-end, not production accuracy on real people.
        Suspicious-activity detection is a rule-based heuristic (darkness + loitering), not trained crime/action
        recognition — no such model exists here. Alerts are simulated (logged server-side), not sent through a real
        Email/SMS/Slack channel — that&apos;s the Notification Engine, Phase 10, not built yet (docs/HLD.md §7).
      </PreviewBanner>

      {error && (
        <div className="my-4">
          <ErrorNotice message={error} />
        </div>
      )}

      <section className="mt-6 rounded-lg bg-white p-5 ring-1 ring-indigo-200 dark:bg-slate-900 dark:ring-indigo-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Full pipeline demo — one video, both detectors
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Generates a single synthetic clip of a person approaching and loitering at a restricted entrance
              after hours, then runs that same clip through both the suspicious-activity zone heuristic and gait
              re-identification against the current gallery — two independent detectors, one video. Seed or enroll
              a watchlisted subject first for a chance at a gait match too.
            </p>
          </div>
          <Button onClick={handleRunCombinedDemo} isLoading={combinedRunning}>
            Run combined demo
          </Button>
        </div>

        {combinedResult && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <DemoVideo filename={combinedResult.video} label="Combined demo clip" />

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Suspicious-activity heuristic (restricted-zone + after-hours)
              </p>
              <div className="mt-1.5">
                <ActivityAnalysisSummary result={combinedResult.activity} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Gait re-identification (against current gallery)
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/50">
                {combinedResult.gait.match ? (
                  <span className="text-slate-700 dark:text-slate-300">
                    Best match: <strong>{combinedResult.gait.match.label}</strong> —{' '}
                    {pct(combinedResult.gait.match.similarity)}
                  </span>
                ) : (
                  <span className="text-slate-500">No match in gallery</span>
                )}
                <AlertOutcome alert={combinedResult.gait.alert} negativeLabel="No alert" />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Real person detection (YOLOv8 + DeepSORT)
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload a real video clip to see actual detection boxes and track IDs drawn frame by frame — this is the
          real detector/tracker, not a heuristic. It needs footage with a recognizable human in it: this repo&apos;s
          own synthetic self-test clips (used elsewhere on this page) don&apos;t look like people to a real
          detector, so they&apos;ll come back with zero tracks found.
        </p>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleAnnotate}>
          <div className="min-w-[240px] flex-1">
            <Field label="Video">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setAnnotateFile(e.target.files?.[0] ?? null)}
                className={FILE_INPUT_CLASSES}
                required
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" isLoading={annotating} disabled={!annotateFile}>
            Detect
          </Button>
        </form>

        {annotateResult && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300">
                {annotateResult.framesProcessed} frames processed
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {annotateResult.tracksFound} {annotateResult.tracksFound === 1 ? 'person' : 'people'} tracked
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                up to {annotateResult.maxDetectionsInFrame} detection(s) in a single frame
              </span>
              {annotateResult.tracksFound === 0 && (
                <Badge tone="gray">No people detected — try a clip with a real, visible person</Badge>
              )}
            </div>
            <DemoVideo filename={annotateResult.video} label="Annotated detection output" />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Gait extraction visualized (tracking + silhouette + signature)
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          /gait/enroll and /gait/watch only ever return a numeric embedding — this shows what actually produces it:
          the real tracked bounding box and the extracted silhouette drawn on every frame, then the resulting Gait
          Energy Image (the actual signature fed to the embedding model) held as a closing card. Needs a real,
          recognizable person walking, same as detection above.
        </p>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleVisualize}>
          <div className="min-w-[240px] flex-1">
            <Field label="Video">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVisualizeFile(e.target.files?.[0] ?? null)}
                className={FILE_INPUT_CLASSES}
                required
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" isLoading={visualizing} disabled={!visualizeFile}>
            Visualize
          </Button>
        </form>

        {visualizeResult && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300">
                {visualizeResult.framesProcessed} frames processed
              </span>
              {visualizeResult.geiCaptured ? (
                <Badge tone="green">Gait signature captured</Badge>
              ) : (
                <Badge tone="gray">Not enough clean silhouette frames for a signature</Badge>
              )}
            </div>
            <DemoVideo filename={visualizeResult.video} label="Gait extraction visualization" />
          </div>
        )}
      </section>

      <h2 className="mt-8 mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Gait Recognition</h2>

      <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">One-click demo</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Generates one synthetic walking video server-side, splits it in half, enrolls the first half as a
              watchlisted subject, then runs the second half through the watch pipeline — no upload needed.
            </p>
          </div>
          <Button onClick={handleRunDemo} isLoading={demoRunning}>
            Run demo
          </Button>
        </div>

        {demoResult && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <ol className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              {demoResult.steps.map((step, i) => (
                <li key={step.step} className="flex gap-2">
                  <span className="font-mono text-xs text-slate-400">{i + 1}.</span>
                  <span>{step.detail}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Enrolled (first half)</p>
                <DemoVideo filename="full_walk_part1_enroll.mp4" label="Enrolled clip (first half)" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Watched (second half)</p>
                <DemoVideo filename="full_walk_part2_watch.mp4" label="Watched clip (second half)" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              {demoResult.match ? (
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Best match: <strong>{demoResult.match.label}</strong> — {pct(demoResult.match.similarity)}{' '}
                  similarity
                </span>
              ) : (
                <span className="text-sm text-slate-500">No match found</span>
              )}
              <AlertOutcome
                alert={demoResult.alert}
                negativeLabel={`No alert (below ${(demoResult.threshold * 100).toFixed(0)}% threshold)`}
              />
            </div>
            {demoResult.alert && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {demoResult.alert.message} — notification simulated (logged server-side), nothing actually sent.
              </p>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enroll a subject</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload a walking clip to add to the gallery.</p>
          <form className="mt-4 space-y-3" onSubmit={handleEnroll}>
            <Field label="Label">
              <Input
                value={enrollLabel}
                onChange={(e) => setEnrollLabel(e.target.value)}
                placeholder="e.g. Alice"
                required
              />
            </Field>
            <Field label="Video">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setEnrollFile(e.target.files?.[0] ?? null)}
                className={FILE_INPUT_CLASSES}
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={enrollWatchlisted}
                onChange={(e) => setEnrollWatchlisted(e.target.checked)}
                className="rounded border-slate-300"
              />
              Watchlisted (a later Watch match against them raises an alert)
            </label>
            <Button
              type="submit"
              variant="secondary"
              isLoading={enrolling}
              disabled={!enrollFile || !enrollLabel.trim()}
            >
              Enroll
            </Button>
          </form>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Watch a clip</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload a clip to identify against the gallery and trigger an alert if it matches a watchlisted subject.
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleWatch}>
            <Field label="Video">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setWatchFile(e.target.files?.[0] ?? null)}
                className={FILE_INPUT_CLASSES}
                required
              />
            </Field>
            <Button type="submit" variant="secondary" isLoading={watching} disabled={!watchFile}>
              Run watch
            </Button>
          </form>

          {watchResult && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/50">
              {watchResult.match ? (
                <span className="text-slate-700 dark:text-slate-300">
                  Best match: <strong>{watchResult.match.label}</strong> — {pct(watchResult.match.similarity)}
                </span>
              ) : (
                <span className="text-slate-500">No match in gallery</span>
              )}
              <AlertOutcome alert={watchResult.alert} negativeLabel="No alert" />
            </div>
          )}
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Gallery</h3>
          <Button size="sm" variant="secondary" onClick={handleSeedGallery} isLoading={seeding}>
            Seed 5 sample suspects
          </Button>
        </div>
        {subjects === null ? (
          <PageSpinner />
        ) : subjects.length === 0 ? (
          <EmptyState title="No subjects enrolled" description="Run the demo, seed sample suspects, or enroll a subject above." />
        ) : (
          <Table>
            <Thead columns={['Label', 'Watchlisted', 'Subject ID']} />
            <Tbody>
              {subjects.map((s) => (
                <tr key={s.subjectId}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{s.label}</Td>
                  <Td>{s.watchlisted ? <Badge tone="amber">Watchlisted</Badge> : <Badge tone="gray">No</Badge>}</Td>
                  <Td className="font-mono text-xs">{s.subjectId}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        )}
      </section>

      <h2 className="mt-10 mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
        Suspicious Activity Detection
      </h2>

      <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">One-click demo — 3 scenarios</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Generates three clips server-side — night + loitering near an entrance, night just walking past, and
              daytime loitering — to show the heuristic only alerts when <em>both</em> darkness and loitering hold.
            </p>
          </div>
          <Button onClick={handleRunActivityDemo} isLoading={activityDemoRunning}>
            Run demo
          </Button>
        </div>

        {activityDemoResult && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            {activityDemoResult.scenarios.map((scenario) => (
              <div key={scenario.video}>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{scenario.description}</p>
                <div className="mt-1.5">
                  <ActivityAnalysisSummary result={scenario} />
                </div>
                <DemoVideo filename={scenario.video} label={scenario.description} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Analyze a clip</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload a clip to run the same heuristic against it directly.
        </p>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleAnalyze}>
          <div className="min-w-[240px] flex-1">
            <Field label="Video">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setAnalyzeFile(e.target.files?.[0] ?? null)}
                className={FILE_INPUT_CLASSES}
                required
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" isLoading={analyzing} disabled={!analyzeFile}>
            Analyze
          </Button>
        </form>

        {analyzeResult && (
          <div className="mt-4">
            <ActivityAnalysisSummary result={analyzeResult} />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Alert history</h2>
        {alerts === null ? (
          <PageSpinner />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No alerts yet"
            description="Alerts appear here from either detector above."
          />
        ) : (
          <Table>
            <Thead columns={['Time', 'Type', 'Subject', 'Severity', 'Message']} />
            <Tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <Td>{new Date(a.timestamp).toLocaleString()}</Td>
                  <Td>
                    <Badge tone="indigo">{a.kind === 'gait_watch' ? 'Gait Watch' : 'Suspicious Activity'}</Badge>
                  </Td>
                  <Td>{a.label}</Td>
                  <Td>
                    <SeverityBadge severity={a.severity} />
                  </Td>
                  <Td className="max-w-md whitespace-normal">{a.message}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
