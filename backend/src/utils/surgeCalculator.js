/**
 * Surge Pricing Calculator
 * Calculates delivery fee multiplier based on demand and weather (mocked)
 */

const getSurgeMultiplier = async () => {
  const currentHour = new Date().getHours();
  let multiplier = 1.0;

  // Peak Hours (Lunch: 12-2 PM, Dinner: 7-9 PM)
  if ((currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21)) {
    multiplier += 0.5; // +0.5x during peak hours
  }

  // Weekend Surge
  const isWeekend = [0, 6].includes(new Date().getDay());
  if (isWeekend) {
    multiplier += 0.2;
  }

  // Random Traffic/Weather Factor (Demo)
  const randomFactor = Math.random();
  if (randomFactor > 0.8) {
    multiplier += 0.3; // Rain or High Traffic
  }

  return Math.min(multiplier, 2.5); // Cap at 2.5x
};

module.exports = { getSurgeMultiplier };
