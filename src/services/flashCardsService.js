import { supabase } from './supabase'

// Decks
export const getDecks = async (userId) => {
  const { data, error } = await supabase
    .from('quiz_decks')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createDeck = async (userId, deckName) => {
  const { data, error } = await supabase
    .from('quiz_decks')
    .insert([{ user_id: userId, name: deckName }])
    .select('id, name, created_at')
    .single()

  if (error) throw error
  return data
}

export const deleteDeck = async (deckId) => {
  const { error } = await supabase.from('quiz_decks').delete().eq('id', deckId)
  if (error) throw error
}

// Cards
export const getCardsForDeck = async (deckId) => {
  const { data, error } = await supabase
    .from('quiz_cards')
    .select('id, question, answer, created_at')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export const addCardToDeck = async (deckId, question, answer) => {
  const { data, error } = await supabase
    .from('quiz_cards')
    .insert([{ deck_id: deckId, question, answer }])
    .select('id, question, answer, created_at')
    .single()

  if (error) throw error
  return data
}

export const deleteCard = async (cardId) => {
  const { error } = await supabase.from('quiz_cards').delete().eq('id', cardId)
  if (error) throw error
}
