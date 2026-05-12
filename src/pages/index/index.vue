<template>
  <view class="page">
    <scroll-view class="content" scroll-y enable-back-to-top>
      <view class="card">
        <view class="field">
          <text class="label">税前月薪（元）</text>
          <input class="input" type="digit" v-model="form.grossSalary" />
        </view>

        <view class="field no-margin">
          <text class="label">年终奖（元）</text>
          <input
            class="input"
            type="digit"
            v-model="form.annualBonus"
            @input="annualBonusEdited = true"
          />
        </view>

        <view class="bonus-quick-row">
          <view
            v-for="m in bonusMultipliers"
            :key="m"
            class="bonus-chip"
            :class="{ active: Number(form.annualBonus || 0) === Number(form.grossSalary || 0) * m }"
            @click="setBonusByMonthMultiplier(m)"
          >
            {{ `×${m}` }}
          </view>
        </view>
      </view>

      <view class="card">
        <text class="card-title">公积金</text>

        <view class="field">
          <text class="label">公积金基数（元）</text>
          <input
            class="input"
            type="digit"
            v-model="form.housingFundBase"
            @input="housingFundBaseEdited = true"
          />
        </view>

        <view class="field">
          <text class="label">公积金个人比例（%）</text>
          <input class="input" type="digit" v-model="form.housingFundRate" />
        </view>

      </view>

      <view class="card card-toggle">
        <view class="toggle-head" @click="ui.showSocialOptions = !ui.showSocialOptions">
          <text class="card-title no-margin">社保参数</text>
          <view class="toggle-icon" :class="{ open: ui.showSocialOptions }"></view>
        </view>

        <view v-if="ui.showSocialOptions" class="toggle-body" @click.stop>
          <view class="field">
          <text class="label">社保缴纳基数</text>
            <input
              class="input"
              type="digit"
              v-model="form.socialBaseMonthly"
              @input="socialBaseEdited = true"
            />
          </view>

          <view class="rate-row">
            <text class="label">养老（%）</text>
            <input class="input small" type="digit" v-model="form.pensionRate" />
          </view>
          <view class="rate-row">
            <text class="label">医疗（%）</text>
            <input class="input small" type="digit" v-model="form.medicalRate" />
          </view>
          <view class="rate-row no-margin">
            <text class="label">失业（%）</text>
            <input class="input small" type="digit" v-model="form.unemploymentRate" />
          </view>
        </view>
      </view>

      <view class="card card-toggle">
        <view class="toggle-head" @click="ui.showSpecialDeduction = !ui.showSpecialDeduction">
          <text class="card-title no-margin">专项扣除</text>
          <view class="toggle-icon" :class="{ open: ui.showSpecialDeduction }"></view>
        </view>

        <view v-if="ui.showSpecialDeduction" class="deduction-list toggle-body" @click.stop>
          <view class="deduction-item" v-for="item in specialDeductionItems" :key="item.key">
            <view class="deduction-main-row">
              <view
                class="deduction-check"
                :class="{ active: item.enabled }"
                @click="toggleDeductionItem(item)"
              >
                <view v-if="item.enabled" class="deduction-check-inner"></view>
              </view>
              <view class="deduction-name-wrap">
                <text class="deduction-name" @click="toggleDeductionItem(item)">{{ item.label }}</text>
                <text
                  v-if="item.helpLines && item.helpLines.length"
                  class="deduction-help"
                  @click.stop="item.showHelp = !item.showHelp"
                >
                  ?
                </text>
              </view>
              <input
                v-if="item.enabled"
                class="input deduction-input deduction-main-input"
                type="digit"
                :value="item.amount"
                @input="onDeductionAmountInput(item, $event)"
              />
            </view>

            <view v-if="item.showHelp && item.helpLines && item.helpLines.length" class="rent-help-panel">
              <text class="rent-help-line" v-for="line in item.helpLines" :key="line">{{ line }}</text>
            </view>

            <view v-if="item.enabled" class="deduction-sub-wrap">
              <view class="deduction-sub-list" v-if="item.options && item.options.length">
                <view
                  class="deduction-sub-item"
                  v-for="(option, index) in item.options"
                  :key="`${item.key}-${index}`"
                  @click="selectDeductionOption(item, index)"
                >
                  <view class="deduction-sub-radio" :class="{ active: item.selectedOption === index }">
                    <view v-if="item.selectedOption === index" class="deduction-sub-radio-inner"></view>
                  </view>
                  <text class="deduction-sub-label">{{ option.label }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="deduction-summary">
            <text>已选合计（月）</text>
            <text class="deduction-total">¥{{ specialDeductionMonthlyTotal.toFixed(0) }}</text>
          </view>
        </view>
      </view>

      <view class="scroll-spacer"></view>
    </scroll-view>

    <view class="footer">
      <button class="calc-btn" @click="handleCalculate">计算</button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { APP_TITLE } from "../../constants/app";

const BASE_DEDUCTION_MONTHLY = 5000;
const TAX_BRACKETS = [
  { upper: 36000, rate: 0.03, quick: 0 },
  { upper: 144000, rate: 0.1, quick: 2520 },
  { upper: 300000, rate: 0.2, quick: 16920 },
  { upper: 420000, rate: 0.25, quick: 31920 },
  { upper: 660000, rate: 0.3, quick: 52920 },
  { upper: 960000, rate: 0.35, quick: 85920 },
  { upper: Infinity, rate: 0.45, quick: 181920 }
];

const BONUS_TAX_BRACKETS = [
  { upper: 3000, rate: 0.03, quick: 0 },
  { upper: 12000, rate: 0.1, quick: 210 },
  { upper: 25000, rate: 0.2, quick: 1410 },
  { upper: 35000, rate: 0.25, quick: 2660 },
  { upper: 55000, rate: 0.3, quick: 4410 },
  { upper: 80000, rate: 0.35, quick: 7160 },
  { upper: Infinity, rate: 0.45, quick: 15160 }
];

const form = reactive({
  grossSalary: "20000",
  socialBaseMonthly: "20000",
  housingFundBase: "20000",
  housingFundRate: "12",
  annualBonus: "20000",
  pensionRate: "8",
  medicalRate: "2",
  unemploymentRate: "0.5",
  specialDeductionMonthly: "0"
});

const ui = reactive({
  showSocialOptions: false,
  showSpecialDeduction: false
});

const bonusMultipliers = [0, 1, 2, 3, 4, 5];

// 专项附加扣除：大项勾选后展开小选项（默认第一项），并支持手动调整金额。
const specialDeductionItems = reactive([
  {
    key: "child",
    label: "子女教育",
    enabled: false,
    amount: "1000",
    selectedOption: 0,
    options: [{ label: "我有3岁以上至博士在接受教育的子女（1000元/月）", amount: 1000 }],
    helpLines: [],
    showHelp: false
  },
  {
    key: "continuing",
    label: "继续教育",
    enabled: false,
    amount: "400",
    selectedOption: 0,
    options: [
      { label: "我正在接受学历继续教育（400元/月）", amount: 400 },
      { label: "我取得职业资格继续教育证书（3600元/年）", amount: 300 }
    ],
    helpLines: [],
    showHelp: false
  },
  {
    key: "medical",
    label: "大病医疗",
    enabled: false,
    amount: "0",
    selectedOption: 0,
    options: [{ label: "我有符合条件的大病医疗支出（按年度汇算申报）", amount: 0 }],
    helpLines: [],
    showHelp: false
  },
  {
    key: "mortgage",
    label: "住房贷款利息",
    enabled: false,
    amount: "1000",
    selectedOption: 0,
    options: [{ label: "我正在为第一套住房偿还房贷（1000元/月）", amount: 1000 }],
    helpLines: ["只能享受首套住房贷款的利息扣除，且按照每月 1000 元"],
    showHelp: false
  },
  {
    key: "rent",
    label: "住房租金",
    enabled: false,
    amount: "1500",
    selectedOption: 0,
    options: [
      { label: "直辖市、省会（首府）城市、计划单列市以及国务院确定的其他城市（1500/月）", amount: 1500 },
      { label: "市辖区户籍人口超过100万的城市（1100/月）", amount: 1100 },
      { label: "市辖区户籍人口不超过100万（含）的城市（800/月）", amount: 800 }
    ],
    maxAmount: 1500,
    helpLines: [
      "1500 元：直辖市、省会（首府）城市、计划单列市以及国务院确定的其他城市",
      "1100 元：市辖区户籍人口超过 100 万的城市",
      "800 元：市辖区户籍人口不超过 100 万（含）的城市"
    ],
    showHelp: false
  },
  {
    key: "elder",
    label: "赡养老人",
    enabled: false,
    amount: "3000",
    selectedOption: 0,
    options: [
      { label: "我是独生子女（3000元/月）", amount: 3000 },
      { label: "我是非独生子女并参与分摊（最高1500元/月）", amount: 1500 }
    ],
    helpLines: [],
    showHelp: false
  },
  {
    key: "infant",
    label: "3岁以下婴幼儿照护",
    enabled: false,
    amount: "2000",
    selectedOption: 0,
    options: [{ label: "我有3岁以下婴幼儿在照护（2000元/月）", amount: 2000 }],
    helpLines: [],
    showHelp: false
  }
]);

const housingFundBaseEdited = ref(false);
const socialBaseEdited = ref(false);
const annualBonusEdited = ref(false);

watch(
  () => form.grossSalary,
  (value) => {
    if (!socialBaseEdited.value) {
      form.socialBaseMonthly = value;
    }
    if (!housingFundBaseEdited.value) {
      form.housingFundBase = value;
    }
    if (!annualBonusEdited.value) {
      form.annualBonus = value;
    }
  }
);

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

function toggleDeductionItem(item) {
  const nextEnabled = !item.enabled;
  if (nextEnabled) {
    const isMortgage = item.key === "mortgage";
    const isRent = item.key === "rent";
    const mortgageItem = specialDeductionItems.find((it) => it.key === "mortgage");
    const rentItem = specialDeductionItems.find((it) => it.key === "rent");
    const hasMortgage = Boolean(mortgageItem?.enabled);
    const hasRent = Boolean(rentItem?.enabled);
    if ((isMortgage && hasRent) || (isRent && hasMortgage)) {
      if (isMortgage && rentItem) {
        rentItem.enabled = false;
      }
      if (isRent && mortgageItem) {
        mortgageItem.enabled = false;
      }
      item.enabled = true;
      uni.showModal({
        title: "提示",
        content: "住房贷款利息和住房租金只能二选一，已为你切换到当前选项",
        showCancel: false
      });
      return;
    }
    if (Array.isArray(item.options) && item.options.length) {
      const option = item.options[item.selectedOption] || item.options[0];
      item.amount = String(num(option?.amount || 0));
    }
  }
  item.enabled = nextEnabled;
}

function selectDeductionOption(item, index) {
  if (!Array.isArray(item.options) || !item.options[index]) return;
  item.selectedOption = index;
  item.amount = String(num(item.options[index].amount || 0));
}

function onDeductionAmountInput(item, event) {
  const value = event?.detail?.value ?? "";
  const parsed = num(value);
  if (item.maxAmount) {
    item.amount = String(Math.min(item.maxAmount, parsed));
    return;
  }
  item.amount = String(parsed);
}

const specialDeductionMonthlyTotal = computed(() =>
  specialDeductionItems.reduce(
    (sum, item) => sum + (item.enabled ? num(item.amount) : 0),
    0
  )
);

watch(
  specialDeductionMonthlyTotal,
  (value) => {
    form.specialDeductionMonthly = String(value);
  },
  { immediate: true, flush: "sync" }
);

function calcSalaryMonthlyTaxList(monthlyTaxableIncome) {
  let previousCumulativeTax = 0;

  return Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    const cumulativeTaxable = monthlyTaxableIncome * monthIndex;
    const bracket =
      TAX_BRACKETS.find((item) => cumulativeTaxable <= item.upper) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
    const cumulativeTax = Math.max(0, cumulativeTaxable * bracket.rate - bracket.quick);
    const monthTax = Math.max(0, cumulativeTax - previousCumulativeTax);
    previousCumulativeTax = cumulativeTax;

    return {
      month: `${monthIndex}月`,
      tax: monthTax
    };
  });
}

function setBonusByMonthMultiplier(multiplier) {
  const base = num(form.grossSalary);
  form.annualBonus = String(Math.round(base * multiplier));
}

function calculateAll() {
  const grossSalary = num(form.grossSalary);
  const annualBonus = num(form.annualBonus);
  // 直接使用 computed，避免 watcher 时序导致的旧值问题
  const specialDeductionMonthly = specialDeductionMonthlyTotal.value;

  const pensionRate = num(form.pensionRate) / 100;
  const medicalRate = num(form.medicalRate) / 100;
  const unemploymentRate = num(form.unemploymentRate) / 100;
  const housingFundRate = num(form.housingFundRate) / 100;

  const socialBaseMonthly = Math.max(0, num(form.socialBaseMonthly) || grossSalary);
  const housingFundBaseMonthly = Math.max(0, num(form.housingFundBase) || grossSalary);

  const pensionMonthly = socialBaseMonthly * pensionRate;
  const medicalMonthly = socialBaseMonthly * medicalRate;
  const unemploymentMonthly = socialBaseMonthly * unemploymentRate;
  const socialInsuranceMonthly = pensionMonthly + medicalMonthly + unemploymentMonthly;

  const housingFundMonthly = housingFundBaseMonthly * housingFundRate;
  const totalDeductionMonthly = socialInsuranceMonthly + housingFundMonthly;

  const taxableIncomeMonthly = Math.max(
    0,
    grossSalary - totalDeductionMonthly - BASE_DEDUCTION_MONTHLY - specialDeductionMonthly
  );

  const salaryTaxList = calcSalaryMonthlyTaxList(taxableIncomeMonthly);
  const monthlyDetails = salaryTaxList.map((item) => {
    const netSalary = grossSalary - totalDeductionMonthly - item.tax;
    return {
      month: item.month,
      tax: item.tax,
      netSalary
    };
  });

  const salaryTaxAnnual = salaryTaxList.reduce((sum, item) => sum + item.tax, 0);
  const netAnnualSalary = monthlyDetails.reduce((sum, item) => sum + item.netSalary, 0);

  const bonusBracket =
    BONUS_TAX_BRACKETS.find((item) => annualBonus / 12 <= item.upper) || BONUS_TAX_BRACKETS[BONUS_TAX_BRACKETS.length - 1];
  const bonusTax = annualBonus > 0 ? Math.max(0, annualBonus * bonusBracket.rate - bonusBracket.quick) : 0;
  const bonusAfterTax = annualBonus - bonusTax;

  const socialInsuranceAnnual = socialInsuranceMonthly * 12;
  const housingFundAnnual = housingFundMonthly * 12;
  const totalTaxAnnual = salaryTaxAnnual + bonusTax;

  const annualGrossIncome = grossSalary * 12 + annualBonus;
  const annualTakeHome = netAnnualSalary + bonusAfterTax;
  const totalIncomeWithFundAndBonus = annualTakeHome + housingFundAnnual;

  const specialDeductionAnnual = specialDeductionMonthly * 12;
  const specialDeductionItemsSnapshot = specialDeductionItems
    .filter((item) => item.enabled)
    .map((item) => ({
      key: item.key,
      label: item.label,
      optionLabel: item.options?.[item.selectedOption]?.label || "",
      amount: num(item.amount)
    }));

  return {
    grossSalary,
    annualBonus,
    socialBaseMonthly,
    housingFundBaseMonthly,
    specialDeductionMonthly,
    specialDeductionAnnual,
    specialDeductionItems: specialDeductionItemsSnapshot,
    pensionMonthly,
    medicalMonthly,
    unemploymentMonthly,
    socialInsuranceMonthly,
    housingFundMonthly,
    totalDeductionMonthly,
    salaryTaxAnnual,
    bonusTax,
    totalTaxAnnual,
    bonusAfterTax,
    netAnnualSalary,
    socialInsuranceAnnual,
    housingFundAnnual,
    annualGrossIncome,
    annualTakeHome,
    totalIncomeWithFundAndBonus,
    monthlyDetails,
    bonusTaxMode: "separate"
  };
}

function handleCalculate() {
  if (num(form.grossSalary) <= 0) {
    uni.showToast({ title: "请先输入税前月薪", icon: "none" });
    return;
  }

  const result = calculateAll();
  uni.setStorageSync("salaryCalcResult", {
    form: { ...form },
    result
  });

  uni.navigateTo({
    url: "/pages/detail/index",
    fail() {
      uni.showToast({ title: "请重启 dev 服务后重试", icon: "none" });
      if (typeof window !== "undefined") {
        window.location.hash = "#/pages/detail/index";
      }
    }
  });
}

onLoad(() => {
  uni.setNavigationBarTitle({ title: APP_TITLE });
});

function money(v) {
  return `¥${Number(v).toFixed(2)}`;
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 24rpx 150rpx;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 18rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 22rpx 22rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #e5e7eb;
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.06);
}

.card-toggle {
  padding: 0 22rpx 22rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  color: #0f172a;
}

.no-margin {
  margin-bottom: 0;
}

.toggle-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 -22rpx 0;
  padding: 22rpx 22rpx 18rpx;
}

.toggle-body {
  padding-top: 10rpx;
}

.toggle-icon {
  width: 14rpx;
  height: 14rpx;
  border-right: 3rpx solid #64748b;
  border-bottom: 3rpx solid #64748b;
  transform: rotate(45deg);
  flex-shrink: 0;
  margin-right: 4rpx;
  transition: transform 0.2s ease;
}

.toggle-icon.open {
  transform: rotate(-135deg);
}

.field {
  margin-bottom: 18rpx;
}

.field.no-margin {
  margin-bottom: 0;
}

.bonus-quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.bonus-chip {
  padding: 8rpx 16rpx;
  border-radius: 10rpx;
  border: 1rpx solid #e5e7eb;
  background: #f1f5f9;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1;
}

.bonus-chip.active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #4b5563;
  font-weight: 600;
}

.label {
  display: block;
  font-size: 26rpx;
  margin-bottom: 8rpx;
  color: #374151;
}

.input {
  height: 74rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 12rpx;
  padding: 0 18rpx;
  font-size: 28rpx;
  background: #ffffff;
}

.hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #64748b;
}

.rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.rate-row.no-margin {
  margin-bottom: 0;
}

.small {
  width: 220rpx;
}

.scroll-spacer {
  height: 0;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid #e5e7eb;
  backdrop-filter: blur(10px);
}

.calc-btn {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  background: #334155;
  color: #ffffff;
  border-radius: 14rpx;
  font-weight: 700;
  font-size: 30rpx;
  border: 2rpx solid #334155;
}

.deduction-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.deduction-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 10rpx 12rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
  background: #ffffff;
}

.deduction-main-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.deduction-name-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.deduction-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  border: 2rpx solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.deduction-check.active {
  border-color: #0ea5e9;
  background: #0ea5e9;
}

.deduction-check-inner {
  width: 10rpx;
  height: 18rpx;
  border-right: 4rpx solid #ffffff;
  border-bottom: 4rpx solid #ffffff;
  transform: rotate(45deg);
  margin-top: -2rpx;
}

.deduction-name {
  flex: 1;
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 500;
}

.deduction-help {
  width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  border-radius: 50%;
  border: 1rpx solid #cbd5e1;
  color: #64748b;
  font-size: 20rpx;
  flex-shrink: 0;
}

.deduction-input {
  width: 180rpx;
  text-align: right;
}

.deduction-main-input {
  width: 150rpx;
  height: 60rpx;
  font-size: 26rpx;
  padding: 0 14rpx;
  flex-shrink: 0;
}

.deduction-sub-wrap {
  width: calc(100% - 52rpx);
  margin-left: 52rpx;
  padding: 2rpx 0 0;
  border-radius: 0;
  background: transparent;
  border: none;
}

.deduction-sub-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.deduction-sub-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 2rpx 0;
}

.deduction-sub-radio {
  width: 30rpx;
  height: 30rpx;
  border-radius: 7rpx;
  border: 2rpx solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.deduction-sub-radio.active {
  border-color: #0ea5e9;
  background: #0ea5e9;
}

.deduction-sub-radio-inner {
  width: 8rpx;
  height: 14rpx;
  border-right: 3rpx solid #ffffff;
  border-bottom: 3rpx solid #ffffff;
  transform: rotate(45deg);
  margin-top: -2rpx;
}

.deduction-sub-label {
  flex: 1;
  font-size: 23rpx;
  color: #334155;
  line-height: 1.3;
}

.rent-help-panel {
  width: 100%;
  margin-top: 4rpx;
  padding: 10rpx 12rpx;
  border-radius: 10rpx;
  background: #f8fafc;
  border: 1rpx dashed #cbd5e1;
}

.rent-help-line {
  display: block;
  font-size: 20rpx;
  line-height: 1.45;
  color: #64748b;
}

.deduction-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6rpx;
  padding-top: 14rpx;
  border-top: 1rpx dashed #e5e7eb;
  font-size: 26rpx;
  color: #334155;
}

.deduction-total {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

@media (min-width: 1024px) {
  .content {
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
  }

  .calc-btn {
    display: block;
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
  }
}
</style>
