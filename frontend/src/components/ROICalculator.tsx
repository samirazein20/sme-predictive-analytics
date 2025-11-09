import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Alert } from '@mui/material';
import { computeROIScenarios, ROICalcInput } from '../utils/roi';

interface ROICalculatorProps {
  baselineRevenue: number; // monthly baseline revenue (e.g. from analysis results)
  growthPercent: number; // predicted growth percent
  defaultGrossMargin?: number; // starting gross margin assumption
  defaultInvestmentRatio?: number; // starting investment ratio assumption
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  baselineRevenue,
  growthPercent,
  defaultGrossMargin = 40,
  defaultInvestmentRatio = 30,
}) => {
  const [grossMarginPercent, setGrossMarginPercent] = useState(defaultGrossMargin);
  const [investmentRatioPercent, setInvestmentRatioPercent] = useState(defaultInvestmentRatio);

  const input: ROICalcInput = {
    baselineRevenue,
    growthPercent,
    grossMarginPercent,
    investmentRatioPercent,
  };

  const scenarios = computeROIScenarios(input);
  const incrementalRevenue = baselineRevenue * (growthPercent / 100);

  return (
    <Box sx={{ mt: 3 }} aria-labelledby="roi-calculator-heading">
      <Typography id="roi-calculator-heading" variant="h6" gutterBottom>
        💰 ROI Calculator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Estimate investment requirements and payback period for scaling operations based on predicted growth. Adjust assumptions to see conservative vs optimistic scenarios.
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Baseline Monthly Revenue ($)"
            fullWidth
            size="small"
            type="number"
            value={baselineRevenue}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Predicted Growth (%)"
            fullWidth
            size="small"
            type="number"
            value={growthPercent.toFixed(1)}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Gross Margin (%)"
            fullWidth
            size="small"
            type="number"
            value={grossMarginPercent}
            onChange={(e) => setGrossMarginPercent(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Investment Ratio (%)"
            fullWidth
            size="small"
            type="number"
            value={investmentRatioPercent}
            onChange={(e) => setInvestmentRatioPercent(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>
      </Grid>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="caption">
          Incremental revenue from growth: ${incrementalRevenue.toFixed(2)} per month. Adjust margins and investment to see payback timelines.
        </Typography>
      </Alert>
      <Card variant="outlined" sx={{ overflowX: 'auto' }}>
        <CardContent>
          <Table size="small" aria-label="ROI scenarios table">
            <TableHead>
              <TableRow>
                <TableCell>Scenario</TableCell>
                <TableCell align="right">Investment Required ($)</TableCell>
                <TableCell align="right">Incremental Revenue ($/mo)</TableCell>
                <TableCell align="right">Incremental Gross Profit ($/mo)</TableCell>
                <TableCell align="right">Payback (months)</TableCell>
                <TableCell align="right">Margin (%)</TableCell>
                <TableCell align="right">Invest Ratio (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scenarios.map(s => (
                <TableRow key={s.label}>
                  <TableCell component="th" scope="row">{s.label}</TableCell>
                  <TableCell align="right">{s.investmentRequired.toFixed(2)}</TableCell>
                  <TableCell align="right">{s.incrementalRevenue.toFixed(2)}</TableCell>
                  <TableCell align="right">{s.incrementalGrossProfit.toFixed(2)}</TableCell>
                  <TableCell align="right">{Number.isFinite(s.paybackMonths) ? s.paybackMonths.toFixed(2) : '—'}</TableCell>
                  <TableCell align="right">{s.grossMarginPercent.toFixed(1)}</TableCell>
                  <TableCell align="right">{s.investmentRatioPercent.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Payback period is estimated as upfront investment divided by monthly incremental gross profit. Adjust assumptions to reflect your business reality.
        </Typography>
      </Box>
    </Box>
  );
};
