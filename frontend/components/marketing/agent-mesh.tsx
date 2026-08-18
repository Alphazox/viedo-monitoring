import Link from "next/link";
import { Reveal } from "./reveal";
import { AGENTS } from "@/lib/sandboxData";

export function AgentMesh() {
  return (
    <section className="sec sec-alt" id="agents">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">How the system is structured</div>
          <h2>Narrow, specialized, and limited on purpose</h2>
          <p>
            Not one model trying to do everything — a pipeline where each part has a specific job, and a specific
            ceiling on what it&apos;s allowed to decide alone.
          </p>
        </Reveal>
        <Reveal className="agents">
          {AGENTS.map((agent, i) => (
            <Link className="agent" href={`/agents/${agent.slug}`} key={agent.slug} transitionTypes={["nav-forward"]}>
              <div className="idx mono">{String(i + 1).padStart(2, "0")}</div>
              <h4>{agent.title}</h4>
              <p>{agent.summary}</p>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
