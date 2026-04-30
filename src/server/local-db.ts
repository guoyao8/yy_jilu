import fs from "fs"
import path from "path"

type Row = Record<string, any> & { _id?: string }
type Store = Record<string, Row[]>
type Direction = "asc" | "desc"

const DEFAULT_COLLECTIONS = [
  "users",
  "families",
  "babies",
  "feedingRecords",
  "photos",
  "milestones",
  "growthRecords",
  "vaccineReminders",
]

const getDbPath = () =>
  process.env.LOCAL_DB_PATH ||
  process.env.SQLITE_DB_PATH ||
  path.join(process.cwd(), "data", "local-db.json")

const ensureStore = () => {
  const dbPath = getDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  if (!fs.existsSync(dbPath)) {
    const initial = DEFAULT_COLLECTIONS.reduce<Store>((store, name) => {
      store[name] = []
      return store
    }, {})
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2))
  }
}

const readStore = (): Store => {
  ensureStore()
  const raw = fs.readFileSync(getDbPath(), "utf-8")
  const parsed = JSON.parse(raw || "{}") as Store
  for (const name of DEFAULT_COLLECTIONS) {
    if (!Array.isArray(parsed[name])) parsed[name] = []
  }
  return parsed
}

const writeStore = (store: Store) => {
  ensureStore()
  fs.writeFileSync(getDbPath(), JSON.stringify(store, null, 2))
}

const matches = (row: Row, where: Record<string, any>) =>
  Object.entries(where).every(([key, value]) => row[key] === value)

const sortRows = (rows: Row[], field?: string, direction: Direction = "asc") => {
  if (!field) return rows
  return [...rows].sort((a, b) => {
    const left = String(a[field] ?? "")
    const right = String(b[field] ?? "")
    return direction === "desc" ? right.localeCompare(left) : left.localeCompare(right)
  })
}

class LocalDoc {
  constructor(
    private readonly collectionName: string,
    private readonly id: string
  ) {}

  async update(input: { data?: Row } | Row) {
    const data = "data" in input && input.data ? input.data : input
    const store = readStore()
    const rows = store[this.collectionName] || []
    const index = rows.findIndex((row) => row._id === this.id)
    if (index === -1) throw new Error("记录不存在")
    rows[index] = { ...rows[index], ...data }
    store[this.collectionName] = rows
    writeStore(store)
    return { updated: 1 }
  }

  async remove() {
    const store = readStore()
    const rows = store[this.collectionName] || []
    store[this.collectionName] = rows.filter((row) => row._id !== this.id)
    writeStore(store)
    return { deleted: rows.length - store[this.collectionName].length }
  }
}

class LocalQuery {
  constructor(
    protected readonly collectionName: string,
    private readonly whereClause: Record<string, any> = {},
    private readonly orderField?: string,
    private readonly orderDirection: Direction = "asc"
  ) {}

  where(whereClause: Record<string, any>) {
    return new LocalQuery(this.collectionName, whereClause, this.orderField, this.orderDirection)
  }

  orderBy(field: string, direction: Direction) {
    return new LocalQuery(this.collectionName, this.whereClause, field, direction)
  }

  limit(count: number) {
    const query = this
    return {
      async get() {
        const result = await query.get()
        return { data: result.data.slice(0, count) }
      },
    }
  }

  async get() {
    const store = readStore()
    const rows = store[this.collectionName] || []
    const filtered = rows.filter((row) => matches(row, this.whereClause))
    return { data: sortRows(filtered, this.orderField, this.orderDirection) }
  }
}

class LocalCollection extends LocalQuery {
  constructor(collectionName: string) {
    super(collectionName)
  }

  async add(input: { data?: Row } | Row) {
    const data = "data" in input && input.data ? input.data : input
    const store = readStore()
    const rows = store[this.collectionName] || []
    const row = {
      ...data,
      _id: data._id || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    }
    rows.push(row)
    store[this.collectionName] = rows
    writeStore(store)
    return { id: row._id, _id: row._id }
  }

  doc(id: string) {
    return new LocalDoc(this.collectionName, id)
  }
}

export const getLocalDb = () => ({
  collection: (name: string) => new LocalCollection(name),
})
