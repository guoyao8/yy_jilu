import cloudbase from "@cloudbase/node-sdk"
import fs from "fs"
import path from "path"

let app: ReturnType<typeof cloudbase.init> | null = null

export const getCloudbaseApp = () => {
  if (app) return app
  const env =
    process.env.CLOUDBASE_ENV_ID ||
    (() => {
      try {
        const configPath = path.join(process.cwd(), "cloudbaserc.json")
        if (!fs.existsSync(configPath)) return undefined
        const raw = fs.readFileSync(configPath, "utf-8")
        const parsed = JSON.parse(raw)
        return typeof parsed?.envId === "string" ? parsed.envId : undefined
      } catch {
        return undefined
      }
    })()
  const secretId =
    process.env.CLOUDBASE_SECRET_ID || process.env.TENCENTCLOUD_SECRETID
  const secretKey =
    process.env.CLOUDBASE_SECRET_KEY || process.env.TENCENTCLOUD_SECRETKEY
  if (!env) {
    throw new Error("CLOUDBASE 环境变量未配置")
  }
  if (secretId && secretKey) {
    app = cloudbase.init({ env, secretId, secretKey })
    return app
  }
  app = cloudbase.init({ env })
  return app
}

export const getDb = () => {
  return getCloudbaseApp().database()
}
