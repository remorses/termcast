import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  prerender: ["/", "/defer-example"],
} satisfies Config;
