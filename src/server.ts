import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";
//import { title } from "node:process";


const server = new McpServer({
  name: "test",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  }
});

server.tool("delete-user", "Delete the last user from the database", {}, { title: "Delete User" },
  async () => {
    try {
      const id = await deleteUser();
      return {
        content: [
          { type: "text", text: `User ${id} has been deleted.` }
        ]
      }
    } catch {
      return {
        content: [
          { type: "text", text: "Failed to delete user" }
        ]
      }
    }
  }
);

server.resource("users", "users://all", {
  description: "Get all users from the database",
  title: "Users",
  mimeType: "application/json",
},
  async uri => {
    const users = await import("./data/user.json", {
      with: { type: "json" }
    }).then(m => m.default);

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users),
          mimeType: "application/json",
        }
      ]
    }
  }
);

server.resource("user-details", new ResourceTemplate("user://{userId}/profile", { list: undefined }), {
  description: "Get user details from the database",
  title: "User Details",
  mimeType: "application/json",
},
  async (uri, {userId}) => {
    const users = await import("./data/user.json", {
      with: { type: "json" }
    }).then(m => m.default);
    
    const user = users.find(u => u.id.toString() === userId) || {id: 99, name: "chauncey", email: "asdf@email.com", address: "123 way place", phone: "123-456-7890"};

    if (user === null){
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({error: "User not found"}),
            mimeType: "application/json"
          }
        ]
      }
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(user),
          mimeType: "application/json",
        }
      ]
    }
  }
);

server.resource(
  'greeting',
  new ResourceTemplate('greeting://{name}', { list: undefined }),
  {
      title: 'Greeting Resource', // Display name for UI
      description: 'Dynamic greeting generator'
  },
  async (uri, { name }) => ({
      contents: [
          {
              uri: uri.href,
              text: `Hello, ${name}!`
          }
      ]
  })
);

async function deleteUser() {
  const users = await import("./data/user.json", {
    with: { type: "json" }
  }).then(m => m.default);

  const id = users.length;

  users.pop();

  await fs.writeFile("./src/data/user.json", JSON.stringify(users, null, 2));

  return id;
}

async function createUser(user: {
  name: string,
  email: string,
  address: string,
  phone: string
}) {
  const users = await import("./data/user.json", {
    with: { type: "json" }
  }).then(m => m.default);

  const id = users.length + 1;

  users.push({ id, ...user });

  await fs.writeFile("./src/data/user.json", JSON.stringify(users, null, 2));

  return id;

};

const addProperty = async(property: {key: string, greeting: string }) => {
  const users = await import("./data/user.json", {
    with: { type: "json" }
  }).then(m => m.default);

  const newUsers = [];

  for(const user of users){
    const newGreeting = `I'm ${user.name}, and this is my greeting: ${property.greeting}`;
    const userWithGreetingProperty = {[property.key]: newGreeting, ...user};
    newUsers.push(userWithGreetingProperty);
  };

  await fs.writeFile("./src/data/user.json", JSON.stringify(newUsers, null, 2));

  return newUsers;
  
};

server.tool("add-property", "Add a property to an existing user", {
  key: z.string(),
  greeting: z.string()
}, {
  title: "Add Property",
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true
}, async (params) => {
  try {
    const newUsers = await addProperty(params);
    return {
      content: [
        {type: "text", text: "You've got new properties, bub1"}
      ]
    }
  } catch {
    return {
      content: [
        { type: "text", text: "Failed to add properties" }
      ]
    }
  }
});



server.tool("create-user", "Create a new user in the database", {
  name: z.string(),
  email: z.string(),
  address: z.string(),
  phone: z.string()
}, {
  title: "Create User",
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true
}, async (params) => {
  try {
    const id = await createUser(params);
    return {
      content: [
        { type: "text", text: `User ${id} created successfully.` }
      ]
    }
  } catch {
    return {
      content: [
        { type: "text", text: "Failed to save user" }
      ]
    }
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main();