import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getDecks, createDeck, getCardsForDeck, addCardToDeck, deleteCard, deleteDeck } from '../services/flashCardsService'

export default function FlashCardsPage() {
  const { user } = useAuth()
  const [decks, setDecks] = useState([])
  const [selectedDeckId, setSelectedDeckId] = useState(null)
  const [selectedDeckCards, setSelectedDeckCards] = useState([])
  const [deckName, setDeckName] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [cardStatuses, setCardStatuses] = useState({})

  useEffect(() => {
    if (!user?.uid) return
    let cancelled = false

    const loadDecks = async () => {
      await Promise.resolve()
      if (cancelled) return

      try {
        setIsLoading(true)
        const data = await getDecks(user.uid)
        if (!cancelled) {
          setDecks(data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load decks: ' + err.message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDecks()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleCreateDeck = async (e) => {
    e.preventDefault()
    if (!deckName.trim()) { setError('Deck name is required'); return }
    try {
      setIsLoading(true)
      const newDeck = await createDeck(user.uid, deckName.trim())
      setDecks([...decks, newDeck])
      setSelectedDeckId(newDeck.id)
      setSelectedDeckCards([])
      setDeckName('')
      setError('')
    } catch (err) {
      setError('Failed to create deck: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectDeck = async (deckId) => {
    setSelectedDeckId(deckId)
    setCardStatuses({})
    try {
      setIsLoading(true)
      const cards = await getCardsForDeck(deckId)
      setSelectedDeckCards(cards)
      setCurrentCardIndex(0)
      setError('')
    } catch (err) {
      setError('Failed to load cards: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCard = async (e) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) { setError('Both question and answer are required'); return }
    if (!selectedDeckId) { setError('Please select a deck first'); return }
    try {
      setIsLoading(true)
      const newCard = await addCardToDeck(selectedDeckId, question.trim(), answer.trim())
      setSelectedDeckCards([...selectedDeckCards, newCard])
      setQuestion('')
      setAnswer('')
      setError('')
    } catch (err) {
      setError('Failed to add card: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async (cardId) => {
    try {
      setIsLoading(true)
      await deleteCard(cardId)
      setSelectedDeckCards(selectedDeckCards.filter((c) => c.id !== cardId))
      setError('')
    } catch (err) {
      setError('Failed to delete card: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDeck = async (deckId) => {
    try {
      setIsLoading(true)
      await deleteDeck(deckId)
      setDecks(decks.filter((d) => d.id !== deckId))
      if (selectedDeckId === deckId) {
        setSelectedDeckId(null)
        setSelectedDeckCards([])
      }
      setError('')
    } catch (err) {
      setError('Failed to delete deck: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkCard = (status) => {
    const currentCard = selectedDeckCards[currentCardIndex]
    setCardStatuses({ ...cardStatuses, [currentCard.id]: status })
    handleNextCard()
  }

  const handleNextCard = () => {
    if (currentCardIndex < selectedDeckCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const selectedDeck = decks.find((d) => d.id === selectedDeckId)
  const currentCard = studyMode && selectedDeckCards.length > 0 ? selectedDeckCards[currentCardIndex] : null
  const currentStatus = currentCard ? cardStatuses[currentCard.id] : null

  const statusCounts = {
    done: Object.values(cardStatuses).filter((s) => s === 'done').length,
    review: Object.values(cardStatuses).filter((s) => s === 'review').length,
    learning: Object.values(cardStatuses).filter((s) => s === 'learning').length,
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-2xl font-bold text-slate-900">FlashCards</h2>
        <p className="text-sm text-slate-600">Create and study flashcard decks</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {studyMode && currentCard ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {/* Progress */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              Card {currentCardIndex + 1} of {selectedDeckCards.length}
            </span>
            <button onClick={() => { setStudyMode(false); setCardStatuses({}) }} className="text-sm font-medium text-orange-600 hover:text-orange-700">
              ← Back
            </button>
          </div>

          {/* Status summary */}
          <div className="mb-4 flex gap-3 text-xs">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">✓ Done: {statusCounts.done}</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">⊙ Review: {statusCounts.review}</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">↻ Learning: {statusCounts.learning}</span>
          </div>

          {/* Card */}
          <div className="mb-6 h-64 relative" style={{ perspective: '1000px' }}>
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-50 p-6 text-center"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                {currentStatus && (
                  <span className={`mb-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    currentStatus === 'done' ? 'bg-green-100 text-green-700' :
                    currentStatus === 'review' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentStatus === 'done' ? 'Marked Done' : currentStatus === 'review' ? 'Marked for Review' : 'Learn Again'}
                  </span>
                )}
                <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Question</p>
                <p className="text-xl font-semibold text-slate-900">{currentCard.question}</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 p-6 text-center"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="mb-3 text-xs font-semibold uppercase text-orange-600">Answer</p>
                <p className="text-xl font-semibold text-slate-900">{currentCard.answer}</p>
              </div>
            </div>
          </div>

          <p className="mb-4 text-center text-xs text-slate-500">
            {isFlipped ? 'Click card to hide answer' : 'Click card to reveal answer'}
          </p>

          {/* Action buttons — visible after flipping */}
          {isFlipped && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => handleMarkCard('done')}
                className="rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                ✓ Mark Done
              </button>
              <button
                onClick={() => handleMarkCard('review')}
                className="rounded-lg bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                ⊙ Mark for Review
              </button>
              <button
                onClick={() => handleMarkCard('learning')}
                className="rounded-lg bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                ↻ Learn Again
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className="rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextCard}
              disabled={currentCardIndex === selectedDeckCards.length - 1}
              className="flex-1 rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Create Deck */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-900">Create New Deck</h3>
              <form onSubmit={handleCreateDeck} className="space-y-2">
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Deck name (e.g., Biology 101)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !deckName.trim()}
                  className="w-full rounded-lg bg-gradient-to-r from-orange-400 to-amber-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:shadow-md disabled:opacity-60"
                >
                  {isLoading ? 'Creating...' : 'Create Deck'}
                </button>
              </form>
            </div>

            {/* Add Card */}
            {selectedDeckId && (
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-900">Add Card to {selectedDeck?.name}</h3>
                <form onSubmit={handleAddCard} className="space-y-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Question"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    disabled={isLoading}
                  />
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Answer"
                    rows="4"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !question.trim() || !answer.trim()}
                    className="w-full rounded-lg bg-gradient-to-r from-orange-400 to-amber-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:shadow-md disabled:opacity-60"
                  >
                    {isLoading ? 'Adding...' : 'Add Card'}
                  </button>
                </form>
              </div>
            )}

            {/* Cards List */}
            {selectedDeckId && selectedDeckCards.length > 0 && (
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{selectedDeckCards.length} Cards</h3>
                  <button
                    onClick={() => { setStudyMode(true); setCurrentCardIndex(0); setIsFlipped(false) }}
                    className="rounded-lg bg-green-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-green-600"
                  >
                    Start Studying
                  </button>
                </div>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {selectedDeckCards.map((card) => (
                    <div key={card.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-slate-900">{card.question}</p>
                        <p className="break-words text-xs text-slate-600">{card.answer}</p>
                      </div>
                      <button onClick={() => handleDeleteCard(card.id)} disabled={isLoading} className="flex-shrink-0 text-red-600 hover:text-red-700 disabled:opacity-50">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Decks Sidebar */}
          <div className="h-fit rounded-xl bg-white p-4 shadow-sm lg:sticky lg:top-4">
            <h3 className="mb-3 font-semibold text-slate-900">My Decks</h3>
            {decks.length === 0 ? (
              <p className="text-sm text-slate-500">No decks yet</p>
            ) : (
              <div className="space-y-2">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    className={`rounded-lg border-2 p-2 transition ${
                      selectedDeckId === deck.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button onClick={() => handleSelectDeck(deck.id)} disabled={isLoading} className="w-full text-left">
                      <p className="text-sm font-medium text-slate-900">{deck.name}</p>
                    </button>
                    <div className="mt-1">
                      <button
                        onClick={() => handleDeleteDeck(deck.id)}
                        disabled={isLoading}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
