const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const recalcClosingStock = async (stockDoc) => {
  // sellerRemainingMilk auto calculate (safety)
  stockDoc.sellerRemainingMilk =
    (stockDoc.sellerTotalAssign || 0) - (stockDoc.sellerSoldQty || 0);

  // closingStock calculate
  stockDoc.closingStock =
    (stockDoc.totalProcured || 0) -
    (stockDoc.sellerSoldQty || 0) -
    (stockDoc.directSoldQty || 0) -
    (stockDoc.wastage || 0);

  // Safety (negative na ho)
  if (stockDoc.sellerRemainingMilk < 0) stockDoc.sellerRemainingMilk = 0;
  if (stockDoc.closingStock < 0) stockDoc.closingStock = 0;

  await stockDoc.save();
};

module.exports = {
  normalizeDate,
  recalcClosingStock,
};
