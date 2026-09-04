import { supabase } from '../lib/supabase'

export async function toggleLike(targetType: 'event' | 'place', targetId: string): Promise<boolean> {
  const userId = (await supabase.auth.getUser()).data.user!.id
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  if (data) {
    await supabase.from('likes').delete().eq('id', data.id)
    return false
  } else {
    await supabase.from('likes').insert({ user_id: userId, target_type: targetType, target_id: targetId })
    return true
  }
}

export async function getUserLikes(targetType: 'event' | 'place'): Promise<Set<string>> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return new Set()
  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
  return new Set((data ?? []).map((d) => d.target_id))
}
