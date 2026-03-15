import cloudbase from "@cloudbase/node-sdk"

let app: ReturnType<typeof cloudbase.init> | null = null

export const getCloudbaseApp = () => {
  if (app) return app
  const env = process.env.CLOUDBASE_ENV_ID
  const secretId = process.env.CLOUDBASE_SECRET_ID
  const secretKey = process.env.CLOUDBASE_SECRET_KEY
  if (!env || !secretId || !secretKey) {
    throw new Error("CLOUDBASE 环境变量未配置")
  }
  app = cloudbase.init({ env, secretId, secretKey })
  return app
}

export const getDb = () => {
  return getCloudbaseApp().database()
}
