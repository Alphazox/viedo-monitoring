import { Reveal } from "./reveal";

const QUERIES = [
  {
    time: "~5 SECONDS",
    text: '"Find the person in a red shirt who entered the north gate between 9 and 11 AM."',
    result: "Attribute + zone + direction filter, VLM-verified, each hit traceable across the whole site.",
  },
  {
    time: "SECONDS TO OVERNIGHT",
    text: '"Show me every instance where someone appeared to fall."',
    result: "Pose-collapse signatures indexed for every track at ingest; a Retro-Scan job covers the rest overnight.",
  },
  {
    time: "~20 SECONDS",
    text: '"What happened at the reception desk between 8:15 and 8:30?"',
    result: "Multi-camera timeline assembled and narrated in plain English, every sentence cited to a clip.",
  },
  {
    time: "~8 SECONDS",
    text: '"Everyone who entered Gate 2 between 7 and 10 PM in dark clothing."',
    result: "Cohort enumeration with a count, contact sheet, badge-match status and CSV/PDF export.",
  },
];

export function Queries() {
  return (
    <section className="sec sec-alt">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Four questions, worked</div>
          <h2>The queries a detection system can&apos;t answer</h2>
          <p>None of these trip a pre-trained rule. All four are answered from the same index, built once at ingest.</p>
        </Reveal>
        <Reveal className="queries">
          {QUERIES.map((q) => (
            <div className="query" key={q.time}>
              <div className="qtime">{q.time}</div>
              <p className="qtext">{q.text}</p>
              <p className="qres">{q.result}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
