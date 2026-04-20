/**
 * SM-2 Algorithm
 * @param {number} easeFactor - current ease factor (default 2.5)
 * @param {number} interval   - current interval in days (default 1)
 * @param {number} repetitions - times reviewed successfully
 * @param {number} rating     - user rating: 1 (Again), 2 (Hard),
 *                              3 (Good), 4 (Easy)
 * @returns {{ easeFactor, interval, repetitions, nextReviewDate }}
 */
export function sm2(easeFactor, interval, repetitions, rating) {
  let newEF = easeFactor
  let newInterval = interval
  let newReps = repetitions

  if (rating >= 3) {
    if (newReps === 0) newInterval = 1
    else if (newReps === 1) newInterval = 6
    else newInterval = Math.round(interval * easeFactor)
    newReps += 1
    newEF = easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02))
    if (newEF < 1.3) newEF = 1.3
  } else {
    newReps = 0
    newInterval = 1
  }

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    easeFactor: parseFloat(newEF.toFixed(2)),
    interval: newInterval,
    repetitions: newReps,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0],
  }
}
