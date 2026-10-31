/** Les fixtures destructives ne sont jamais disponibles en production. */
export function developmentAgentToolsEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return (environment.NODE_ENV === "development" || environment.NODE_ENV === "test") && environment.AGENT_TOOLS_ENABLED === "true";
}
