import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

interface TodoItem {
  id: string
  title: string
  completed: boolean
}

async function apiFetch(groupSlug: string, path: string, options?: RequestInit) {
  return fetch(`${API_BASE}/api/v1/${groupSlug}/apps/todo${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  })
}

export default function TodoNativeScreen({ groupSlug }: { groupSlug?: string }) {
  if (!groupSlug) throw new Error('TodoNativeScreen requires groupSlug prop')

  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch(groupSlug, '')
      .then(r => r.ok ? r.json() : [])
      .then((data: TodoItem[]) => { setTodos(data); setLoading(false) })
  }, [groupSlug])

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title || saving) return
    setSaving(true)
    setNewTitle('')
    const res = await apiFetch(groupSlug, '', {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
    if (res.ok) {
      const item: TodoItem = await res.json()
      setTodos(prev => [item, ...prev])
    }
    setSaving(false)
  }

  async function handleToggle(id: string, completed: boolean) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
    await apiFetch(groupSlug, `/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) })
  }

  async function handleDelete(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
    await apiFetch(groupSlug, `/${id}`, { method: 'DELETE' })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="New task…"
          placeholderTextColor="#94A3B8"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addButton, (!newTitle.trim() || saving) && styles.disabled]}
          onPress={handleAdd}
          disabled={!newTitle.trim() || saving}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => handleToggle(item.id, !item.completed)}
            onLongPress={() => handleDelete(item.id)}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.rowText, item.completed && styles.rowTextDone]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A',
    backgroundColor: '#FFF',
  },
  addButton: {
    backgroundColor: '#4F46E5', borderRadius: 10,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  disabled: { opacity: 0.4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 10, padding: 12,
    marginBottom: 6, borderWidth: 1, borderColor: '#F1F5F9',
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkmark: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  rowText: { flex: 1, fontSize: 14, color: '#1E293B' },
  rowTextDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  empty: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 40 },
})
