import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Account {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

const ACCOUNTS_KEY = 'accounts'
const ACTIVE_ACCOUNT_KEY = 'active_account_id'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])
  const activeAccountId = ref<string | null>(null)

  const activeAccount = computed(() =>
    accounts.value.find((a) => a.id === activeAccountId.value) ?? null
  )

  async function load() {
    try {
      const [accountsResult, activeResult] = await Promise.all([
        window.api.settings.get(ACCOUNTS_KEY),
        window.api.settings.get(ACTIVE_ACCOUNT_KEY),
      ])
      if (accountsResult.success && accountsResult.data) {
        accounts.value = JSON.parse(accountsResult.data)
      }
      if (activeResult.success && activeResult.data) {
        activeAccountId.value = activeResult.data
      }
    } catch (e) {
      console.error('Failed to load accounts:', e)
    }
  }

  async function save() {
    await Promise.all([
      window.api.settings.set(ACCOUNTS_KEY, JSON.stringify(accounts.value)),
      window.api.settings.set(ACTIVE_ACCOUNT_KEY, activeAccountId.value ?? ''),
    ]).catch(console.error)
  }

  function addAccount(name: string, email: string) {
    const id = crypto.randomUUID()
    accounts.value.push({ id, name, email })
    if (!activeAccountId.value) {
      activeAccountId.value = id
    }
    save()
    return id
  }

  function removeAccount(id: string) {
    accounts.value = accounts.value.filter((a) => a.id !== id)
    if (activeAccountId.value === id) {
      activeAccountId.value = accounts.value[0]?.id ?? null
    }
    save()
  }

  function setActive(id: string) {
    activeAccountId.value = id
    save()
  }

  function updateAccount(id: string, updates: Partial<Pick<Account, 'name' | 'email'>>) {
    const account = accounts.value.find((a) => a.id === id)
    if (account) {
      Object.assign(account, updates)
      save()
    }
  }

  return {
    accounts,
    activeAccountId,
    activeAccount,
    load,
    addAccount,
    removeAccount,
    setActive,
    updateAccount,
  }
})
