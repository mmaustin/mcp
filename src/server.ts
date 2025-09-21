import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "test",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  }
});

function main (){
  console.log("apples");
  
}
main()