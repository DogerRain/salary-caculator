<template>
  <view class="page">
    <scroll-view class="content" scroll-y enable-back-to-top>
      <view v-if="!result" class="card empty">
        <text>未找到计算结果，请先返回首页计算。</text>
        <button class="back-btn" @click="goBack">返回首页</button>
      </view>

      <view v-else>
        <view class="card hero-card">
          <view class="hero-main">
            <view class="hero-main-item">
              <view class="rating-bubble">
                <text class="rating-title">{{ salaryRating.title }}</text>
                <text class="rating-percent">
                  超过全国<text class="rating-percent-num">{{ roundedPercent(salaryRating.percent) }}%</text>的人
                </text>
              </view>
              <view class="hero-label-row">
                <text class="hero-label">到手月均</text>
              </view>
              <text class="hero-amount">¥{{ plainMoney(monthlyTakeHomeAvg) }}</text>
              <text class="hero-hint">不含公积金、年终奖</text>
            </view>
            <view class="hero-main-divider"></view>
            <view class="hero-main-item">
              <view class="hero-label-row">
                <text class="hero-label">综合月均</text>
              </view>
              <text class="hero-amount alt">¥{{ plainMoney(monthlyTotalAvg) }}</text>
              <text class="hero-hint">含公积金 + 年终奖均摊</text>
            </view>
          </view>

          <view class="hero-sub">
            <view class="hero-sub-item">
              <text class="hero-sub-label">年到手收入</text>
              <text class="hero-sub-value">¥{{ plainMoney(result.annualTakeHome) }}</text>
            </view>
            <view class="hero-divider"></view>
            <view class="hero-sub-item">
              <text class="hero-sub-label">总收入（含公积金、年终奖）</text>
              <text class="hero-sub-value">¥{{ plainMoney(totalIncomeValue) }}</text>
            </view>
          </view>
        </view>

        <view class="card bill-card">
          <text class="bill-title">年度收支明细</text>

          <view class="bill-row plus">
            <text class="bill-op"></text>
            <text class="bill-name">税前月薪 × 12</text>
            <text class="bill-value">¥{{ plainMoney((result.grossSalary || 0) * 12) }}</text>
          </view>
          <view class="bill-row plus">
            <text class="bill-op">+</text>
            <text class="bill-name">年终奖</text>
            <text class="bill-value">¥{{ plainMoney(result.annualBonus) }}</text>
          </view>

          <view class="bill-row subtotal">
            <text class="bill-op">=</text>
            <text class="bill-name">税前总收入</text>
            <text class="bill-value">¥{{ plainMoney(result.annualGrossIncome) }}</text>
          </view>

          <view class="bill-row minus">
            <text class="bill-op">−</text>
            <text class="bill-name">五险</text>
            <text class="bill-value">-¥{{ plainMoney(result.socialInsuranceAnnual) }}</text>
          </view>
          <view class="bill-row minus">
            <text class="bill-op">−</text>
            <text class="bill-name">个税</text>
            <text class="bill-value">-¥{{ plainMoney(result.totalTaxAnnual) }}</text>
          </view>
          <view class="bill-row minus">
            <text class="bill-op">−</text>
            <text class="bill-name">公积金（个人缴存）</text>
            <text class="bill-value">-¥{{ plainMoney(result.housingFundAnnual) }}</text>
          </view>

          <view class="bill-row result mid">
            <text class="bill-op">=</text>
            <text class="bill-name">到手收入（现金）</text>
            <text class="bill-value">¥{{ plainMoney(result.annualTakeHome) }}</text>
          </view>

          <view class="bill-row plus">
            <text class="bill-op"></text>
            <text class="bill-name">公积金（个人 + 公司）</text>
            <text class="bill-value">+¥{{ plainMoney(housingFundCombinedAnnual) }}</text>
          </view>

          <view class="bill-row result final">
            <text class="bill-op">=</text>
            <text class="bill-name">总收入（含公积金、年终奖）</text>
            <text class="bill-value">¥{{ plainMoney(totalIncomeValue) }}</text>
          </view>
        </view>

        <view class="card summary-card">
          <view class="sum-row sum-row-toggle summary-toggle" @click="showSummaryDetail = !showSummaryDetail">
            <view class="sum-row-title">
              <text>{{ showSummaryDetail ? "收起明细" : "展开明细" }}</text>
            </view>
            <view class="toggle-icon" :class="{ open: showSummaryDetail }"></view>
          </view>

          <view v-if="showSummaryDetail">
          <!-- 1) 税前总收入 + 年度收入构成分析 -->
          <view class="sum-section">
            <view class="sum-row">
              <text>税前总收入</text>
              <text>{{ money(result.annualGrossIncome) }}</text>
            </view>
            <view class="sum-detail chart-detail">
              <text class="detail-title">年度收入构成分析</text>
              <view class="chart-wrap">
                <view class="canvas-wrap">
                  <canvas
                    class="pie-canvas"
                    canvas-id="incomePie"
                    id="incomePie"
                    :width="CHART_SIZE"
                    :height="CHART_SIZE"
                  ></canvas>
                </view>

                <view class="legend-wrap">
                  <view class="legend-item" v-for="item in chartItems" :key="item.name">
                    <view class="legend-top">
                      <view class="dot" :style="{ backgroundColor: item.color }"></view>
                      <text class="legend-name">{{ item.name }}</text>
                      <text class="legend-percent">{{ item.percent }}%</text>
                    </view>
                    <text class="legend-amount">{{ money(item.value) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 2) 五险支出（不含公积金） -->
          <view class="sum-section">
            <view class="sum-row red">
              <text>五险支出</text>
              <text class="sum-row-amount">-{{ money(result.socialInsuranceAnnual) }}</text>
            </view>
            <view class="sum-detail ledger-detail">
              <view class="ledger-row ledger-header">
                <text class="ledger-name"></text>
                <text class="ledger-calc">月</text>
                <text class="ledger-total">年</text>
              </view>
              <view class="ledger-row" v-for="item in insuranceBreakdown" :key="item.label">
                <text class="ledger-name">{{ item.label }}</text>
                <text class="ledger-calc">{{ plainMoney(item.monthly) }}</text>
                <text class="ledger-total">{{ plainMoney(item.monthly * 12) }}</text>
              </view>
              <view class="ledger-row ledger-sum">
                <text class="ledger-name">合计</text>
                <text class="ledger-calc"></text>
                <text class="ledger-total">{{ plainMoney(result.socialInsuranceAnnual || 0) }}</text>
              </view>
            </view>
          </view>

          <!-- 3) 住房公积金支出（单独一栏） -->
          <view class="sum-section">
            <view class="sum-row income">
              <text>公积金</text>
              <text class="sum-row-amount">+{{ money(housingFundCombinedAnnual) }}</text>
            </view>
            <view class="sum-detail ledger-detail">
              <view class="ledger-row ledger-header">
                <text class="ledger-name"></text>
                <text class="ledger-calc">月</text>
                <text class="ledger-total">年</text>
              </view>
              <view class="ledger-row">
                <text class="ledger-name">个人缴存</text>
                <text class="ledger-calc">{{ plainMoney(housingFundPersonalMonthly) }}</text>
                <text class="ledger-total">{{ plainMoney(housingFundPersonalMonthly * 12) }}</text>
              </view>
              <view class="ledger-row">
                <text class="ledger-name">公司缴存</text>
                <text class="ledger-calc">{{ plainMoney(housingFundCompanyMonthly) }}</text>
                <text class="ledger-total">{{ plainMoney(housingFundCompanyMonthly * 12) }}</text>
              </view>
              <view class="ledger-row ledger-sum housing-sum-row">
                <text class="ledger-name">合计</text>
                <text class="ledger-calc"></text>
                <text class="ledger-total">{{ plainMoney(housingFundCombinedAnnual) }}</text>
              </view>
            </view>
          </view>

          <!-- 4) 专项附加扣除明细 -->
          <view class="sum-section" v-if="result.specialDeductionAnnual > 0">
            <view class="sum-row special-deduction-row">
              <text>专项附加扣除</text>
            </view>
            <view class="sum-detail ledger-detail">
              <view class="ledger-row ledger-header">
                <text class="ledger-name">项目</text>
                <text class="ledger-calc">月</text>
                <text class="ledger-total">年</text>
              </view>
              <view class="ledger-row" v-for="item in specialDeductionDetails" :key="item.key">
                <text class="ledger-name">{{ item.label }}</text>
                <text class="ledger-calc">{{ plainMoney(item.monthly) }}</text>
                <text class="ledger-total">{{ plainMoney(item.annual) }}</text>
              </view>
              <view class="ledger-row ledger-sum special-deduction-sum-row">
                <text class="ledger-name">合计</text>
                <text class="ledger-calc">{{ plainMoney(specialDeductionMonthlyTotal) }}</text>
                <text class="ledger-total">{{ plainMoney(result.specialDeductionAnnual) }}</text>
              </view>
            </view>
          </view>

          <!-- 5) 个税缴纳总额 + 每月明细 -->
          <view class="sum-section">
            <view class="sum-row red">
              <text>个税缴纳总额</text>
              <text>-{{ money(result.totalTaxAnnual) }}</text>
            </view>
            <view class="sum-detail table-detail">
              <view class="table-head row">
                <text class="col month">月份</text>
                <text class="col insurance">五险</text>
                <text class="col fund">公积金</text>
                <text class="col tax">个税</text>
                <text class="col take">到手</text>
              </view>

              <view class="row table-row" v-for="item in monthlyDetails" :key="item.month">
                <text class="col month">{{ item.month }}</text>
                <text class="col insurance red">-{{ plainMoney(result.socialInsuranceMonthly) }}</text>
                <text class="col fund red">-{{ plainMoney(result.housingFundMonthly) }}</text>
                <text class="col tax red">-{{ plainMoney(item.tax) }}</text>
                <text class="col take">{{ plainMoney(item.netSalary) }}</text>
              </view>

              <view class="row table-row total-row total-row-primary">
                <text class="col month">总计</text>
                <text class="col insurance red">-{{ plainMoney(result.socialInsuranceAnnual) }}</text>
                <text class="col fund red">-{{ plainMoney(result.housingFundAnnual) }}</text>
                <text class="col tax red">-{{ plainMoney(result.salaryTaxAnnual) }}</text>
                <text class="col take">{{ plainMoney(result.netAnnualSalary) }}</text>
              </view>

              <view class="row table-row bonus-row" v-if="(result.annualBonus || 0) > 0">
                <text class="col month">年终奖</text>
                <text class="col insurance">--</text>
                <text class="col fund">--</text>
                <text class="col tax red">-{{ plainMoney(result.bonusTax) }}</text>
                <text class="col take">+{{ plainMoney(result.bonusAfterTax) }}</text>
              </view>

              <view class="row table-row total-row total-row-bonus" v-if="(result.annualBonus || 0) > 0">
                <text class="col month">合计</text>
                <text class="col insurance red">-{{ plainMoney(result.socialInsuranceAnnual) }}</text>
                <text class="col fund red">-{{ plainMoney(result.housingFundAnnual) }}</text>
                <text class="col tax red">-{{ plainMoney(result.totalTaxAnnual) }}</text>
                <text class="col take">{{ plainMoney(result.annualTakeHome) }}</text>
              </view>
            </view>
          </view>

          <view class="sum-section formula-section">
            <view class="sum-row formula-title-row">
              <text>计算公式</text>
            </view>
            <view class="sum-detail formula-detail">
              <view class="formula-card">
                <text class="formula-name">年到手收入 {{ plainMoney(result.annualTakeHome) }}</text>
                <text class="formula-exp">
                  = 税前总收入({{ plainMoney(result.annualGrossIncome) }}) - 五险({{ plainMoney(result.socialInsuranceAnnual) }}) -
                  公积金个人缴存({{ plainMoney(result.housingFundAnnual) }}) - 个税总额({{ plainMoney(result.totalTaxAnnual) }})
                </text>
              </view>

              <view class="formula-card">
                <text class="formula-name">累计纳税所得额 {{ plainMoney(cumulativeTaxableIncome) }}</text>
                <text class="formula-exp">
                 = 累计收入({{ plainMoney((result.grossSalary || 0) * 12) }}) - 累计免税收入({{ plainMoney(ANNUAL_BASIC_DEDUCTION) }}) -
                  累计社保个人缴纳({{ plainMoney(result.socialInsuranceAnnual) }}) - 累计公积金个人缴纳({{ plainMoney(result.housingFundAnnual) }})
                  - 累计专项附加扣除({{ plainMoney(result.specialDeductionAnnual || 0) }})
                </text>
              </view>

              <view class="formula-card">
                <text class="formula-name">个税缴纳总额 {{ plainMoney(result.totalTaxAnnual) }}</text>
                <text class="formula-exp">
                  = 工资薪金累计预扣个税 {{ plainMoney(result.salaryTaxAnnual) }} ≈ 累计纳税所得额({{ plainMoney(cumulativeTaxableIncome) }}) × 预扣率({{
                    Math.round(applicableTaxBracket.rate * 100)
                  }}%)<text class="formula-help formula-help-inline" @click.stop="showTaxRateModal = true">?</text>
                  − 速算扣除数({{ plainMoney(applicableTaxBracket.quick) }})
                </text>
                <text class="formula-exp" v-if="(result.annualBonus || 0) > 0">
                  + 年终奖单独计税 {{ plainMoney(result.bonusTax) }} = 年终奖({{ plainMoney(result.annualBonus) }}) × 税率({{
                    Math.round(applicableBonusBracket.rate * 100)
                  }}%)<text class="formula-help formula-help-inline" @click.stop="showBonusRateModal = true">?</text>
                  − 速算扣除数({{ plainMoney(applicableBonusBracket.quick) }})
                </text>
              </view>
            </view>
          </view>
          </view>

          <view class="income-formula">
            <text class="income-formula-title">
              {{ APP_TITLE }} @<text class="income-formula-link" @click="openHelloCoder">{{ HELLO_CODER_NAME }}</text>
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
    <view v-if="showTaxRateModal" class="tax-rate-modal-mask" @click="showTaxRateModal = false">
      <view class="tax-rate-modal" @click.stop>
        <text class="tax-rate-modal-title">预扣率表</text>
        <view class="tax-rate-head">
          <text class="col level">级数</text>
          <text class="col range">累计应纳税所得额</text>
          <text class="col rate">预扣率(%)</text>
          <text class="col quick">速算扣除数</text>
        </view>
        <view
          class="tax-rate-row"
          :class="{ active: item.level === applicableTaxBracket.level }"
          v-for="item in TAX_RATE_TABLE"
          :key="item.level"
        >
          <text class="col level">{{ item.level }}</text>
          <text class="col range">{{ item.label }}</text>
          <text class="col rate">{{ Math.round(item.rate * 100) }}</text>
          <text class="col quick">{{ item.quick }}</text>
        </view>
        <button class="tax-rate-close" @click="showTaxRateModal = false">我知道了</button>
      </view>
    </view>
    <view v-if="showBonusRateModal" class="tax-rate-modal-mask" @click="showBonusRateModal = false">
      <view class="tax-rate-modal" @click.stop>
        <text class="tax-rate-modal-title">年终奖适用税率表</text>
        <text class="tax-rate-modal-source">表格来源：根据财政部、税务总局公告2023年第30号</text>
        <view class="tax-rate-head bonus-rate-head">
          <text class="col level">级数</text>
          <text class="col range">全月应纳税所得额</text>
          <text class="col rate">税率(%)</text>
          <text class="col quick">速算扣除数</text>
        </view>
        <view
          class="tax-rate-row"
          :class="{ active: item.level === applicableBonusBracket.level && (result.annualBonus || 0) > 0 }"
          v-for="item in BONUS_TAX_BRACKETS"
          :key="item.level"
        >
          <text class="col level">{{ item.level }}</text>
          <text class="col range">{{ item.label }}</text>
          <text class="col rate">{{ Math.round(item.rate * 100) }}</text>
          <text class="col quick">{{ item.quick }}</text>
        </view>
        <button class="tax-rate-close" @click="showBonusRateModal = false">我知道了</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { onLoad, onReady, onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";
import { APP_TITLE, HELLO_CODER_NAME, HELLO_CODER_QR_URL } from "../../constants/app";

const result = ref(null);
const showSummaryDetail = ref(false);
const showTaxRateModal = ref(false);
const showBonusRateModal = ref(false);
let ready = false;
const CHART_SIZE = 240;
const CHART_CENTER = CHART_SIZE / 2;
const CHART_RADIUS = 66;
const CHART_LINE_WIDTH = 24;
const ANNUAL_BASIC_DEDUCTION = 60000;
const TAX_RATE_TABLE = [
  { level: 1, label: "不超过36000元的部分", upper: 36000, rate: 0.03, quick: 0 },
  { level: 2, label: "超过36000元至144000元的部分", upper: 144000, rate: 0.1, quick: 2520 },
  { level: 3, label: "超过144000元至300000元的部分", upper: 300000, rate: 0.2, quick: 16920 },
  { level: 4, label: "超过300000元至420000元的部分", upper: 420000, rate: 0.25, quick: 31920 },
  { level: 5, label: "超过420000元至660000元的部分", upper: 660000, rate: 0.3, quick: 52920 },
  { level: 6, label: "超过660000元至960000元的部分", upper: 960000, rate: 0.35, quick: 85920 },
  { level: 7, label: "超过960000元的部分", upper: Infinity, rate: 0.45, quick: 181920 }
];

// 年终奖单独计税：奖金÷12 对应「全月应纳税所得额」税率表（财政部、税务总局公告2023年第30号），与首页计算一致
const BONUS_TAX_BRACKETS = [
  { level: 1, upper: 3000, label: "不超过3000元的", rate: 0.03, quick: 0 },
  { level: 2, upper: 12000, label: "超过3000元至12000元的部分", rate: 0.1, quick: 210 },
  { level: 3, upper: 25000, label: "超过12000元至25000元的部分", rate: 0.2, quick: 1410 },
  { level: 4, upper: 35000, label: "超过25000元至35000元的部分", rate: 0.25, quick: 2660 },
  { level: 5, upper: 55000, label: "超过35000元至55000元的部分", rate: 0.3, quick: 4410 },
  { level: 6, upper: 80000, label: "超过55000元至80000元的部分", rate: 0.35, quick: 7160 },
  { level: 7, upper: Infinity, label: "超过80000元的部分", rate: 0.45, quick: 15160 }
];

const monthlyDetails = computed(() => {
  return result.value?.monthlyDetails || [];
});

const specialDeductionDetails = computed(() => {
  if (!Array.isArray(result.value?.specialDeductionItems)) return [];
  return result.value.specialDeductionItems.map((item, index) => {
    const monthly = Number(item?.amount || 0);
    return {
      key: item?.key || `special-${index}`,
      label: item?.label || "专项扣除",
      monthly,
      annual: monthly * 12
    };
  });
});

const specialDeductionMonthlyTotal = computed(() =>
  specialDeductionDetails.value.reduce((sum, item) => sum + item.monthly, 0)
);

const cumulativeTaxableIncome = computed(() => {
  if (!result.value) return 0;
  const annualSalaryIncome = Number(result.value.grossSalary || 0) * 12;
  return Math.max(
    0,
    annualSalaryIncome -
      ANNUAL_BASIC_DEDUCTION -
      Number(result.value.socialInsuranceAnnual || 0) -
      Number(result.value.housingFundAnnual || 0) -
      Number(result.value.specialDeductionAnnual || 0)
  );
});

const applicableTaxBracket = computed(() => {
  const taxable = cumulativeTaxableIncome.value;
  return TAX_RATE_TABLE.find((item) => taxable <= item.upper) || TAX_RATE_TABLE[TAX_RATE_TABLE.length - 1];
});

const applicableBonusBracket = computed(() => {
  if (!result.value) return BONUS_TAX_BRACKETS[0];
  const bonus = Number(result.value.annualBonus || 0);
  if (bonus <= 0) return BONUS_TAX_BRACKETS[0];
  const monthlyEquivalent = bonus / 12;
  return (
    BONUS_TAX_BRACKETS.find((item) => monthlyEquivalent <= item.upper) ||
    BONUS_TAX_BRACKETS[BONUS_TAX_BRACKETS.length - 1]
  );
});

const monthlyTakeHomeAvg = computed(() => {
  if (!result.value) return 0;
  return (result.value.netAnnualSalary || 0) / 12;
});

const monthlyTotalAvg = computed(() => {
  return totalIncomeValue.value / 12;
});

const SALARY_RANKS = [
  { min: 250000, percent: "99.99", titles: ["钞能力者", "夯爆了", "天花板", "壕无人性"] },
  { min: 100000, percent: "99.97", titles: ["神壕本壕", "神中神", "顶流壕", "富贵命"] },
  { min: 80000, percent: "99.90", titles: ["人形印钞机", "真豪杰", "超新星", "王炸局"] },
  { min: 60000, percent: "99.80", titles: ["凡尔赛本赛", "大牛级", "自由派", "赢麻了"] },
  { min: 50000, percent: "99.60", titles: ["财务小自由", "一方霸", "阔气局", "稳富了"] },
  { min: 40000, percent: "99.00", titles: ["打工皇帝", "领跑者", "强者局", "高配党"] },
  { min: 35000, percent: "98.50", titles: ["高级牛马", "精英范", "优雅卷", "能打王"] },
  { min: 30000, percent: "97.00", titles: ["躺赢选手", "中流柱", "顺风局", "稳进阶"] },
  { min: 28000, percent: "95.00", titles: ["人上人了", "优等马", "风火轮", "小豪横"] },
  { min: 25000, percent: "95.00", titles: ["快乐打工人", "挺能打", "奶茶王", "小富即安"] },
  { min: 22000, percent: "92.00", titles: ["小资派", "挺能攒", "松弛感", "生活家"] },
  { min: 20000, percent: "90.00", titles: ["舒坦牛", "小有颜面", "不心慌", "能存钱"] },
  { min: 18000, percent: "85.00", titles: ["有点香", "有盼头", "小宽裕", "稳步走"] },
  { min: 15000, percent: "80.00", titles: ["小滋润", "好好干", "过得去", "还能浪"] },
  { min: 13000, percent: "75.00", titles: ["稳如狗", "稳住牛", "不拉胯", "有余粮"] },
  { min: 12000, percent: "70.00", titles: ["能活", "还不错", "小安心", "有得花"] },
  { min: 10000, percent: "65.00", titles: ["及格牛马", "及格线", "主流档", "刚上岸"] },
  { min: 8000, percent: "55.00", titles: ["努力搬砖", "努力牛", "省着花", "打拼中"] },
  { min: 6000, percent: "45.00", titles: ["凑合过呗", "搬砖人", "还能扛", "挺住啊"] },
  { min: 5000, percent: "35.00", titles: ["月光小丑", "凑合过", "月月光", "吃土边"] },
  { min: 4000, percent: "25.00", titles: ["紧仔", "紧巴巴", "勒裤带", "抠搜党"] },
  { min: 3000, percent: "15.00", titles: ["难兄难弟", "快不行", "熬着吧", "省省花"] },
  { min: 2000, percent: "8.00", titles: ["苦哈哈", "难顶啊", "风中站", "硬撑着"] },
  { min: 1000, percent: "3.00", titles: ["拉完了", "低空飞", "太难了", "喝风去"] },
  { min: 0, percent: "1.00", titles: ["真拉了", "破防了", "别摆烂", "先活着"] }
];

const salaryRating = ref({ title: "待定", percent: "0.00" });

function pickRandomTitle(titles) {
  if (!Array.isArray(titles) || titles.length === 0) return "待定";
  return titles[Math.floor(Math.random() * titles.length)];
}

function updateSalaryRating() {
  const monthly = Number(result.value?.grossSalary || 0);
  const matched = SALARY_RANKS.find((item) => monthly >= item.min) || SALARY_RANKS[SALARY_RANKS.length - 1];
  salaryRating.value = {
    title: pickRandomTitle(matched.titles),
    percent: matched.percent
  };
}

const insuranceBreakdown = computed(() => {
  if (!result.value) return [];
  return [
    { label: "养老保险", monthly: result.value.pensionMonthly || 0 },
    { label: "医疗保险", monthly: result.value.medicalMonthly || 0 },
    { label: "失业保险", monthly: result.value.unemploymentMonthly || 0 }
  ];
});

const housingFundPersonalMonthly = computed(() => result.value?.housingFundMonthly || 0);
const housingFundCompanyMonthly = computed(() => housingFundPersonalMonthly.value);
const housingFundCombinedMonthly = computed(
  () => housingFundPersonalMonthly.value + housingFundCompanyMonthly.value
);
const housingFundCombinedAnnual = computed(() => housingFundCombinedMonthly.value * 12);

// 总收入兜底计算（避免旧 storage 里没有 combined 字段导致数字不一致）
const totalIncomeValue = computed(() => {
  if (!result.value) return 0;
  return (result.value.annualTakeHome || 0) + housingFundCombinedAnnual.value;
});

const chartItems = computed(() => {
  if (!result.value) return [];

  const items = [
    { name: "到手收入", value: result.value.annualTakeHome, color: "#ef4444" },
    { name: "五险支出", value: result.value.socialInsuranceAnnual, color: "#15803d" },
    { name: "个税支出", value: result.value.totalTaxAnnual, color: "#22c55e" },
    { name: "住房公积金", value: result.value.housingFundAnnual, color: "#f97316" }
  ];

  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return items.map((item) => ({ ...item, percent: "0" }));
  }

  return items.map((item) => ({
    ...item,
    percent: Math.round((item.value / total) * 100)
  }));
});

const centerPercent = computed(() => {
  if (!chartItems.value.length) return "0";
  return String(chartItems.value[0].percent);
});

watch(showSummaryDetail, (expanded) => {
  if (expanded) {
    nextTick(() => {
      drawDonutWhenReady();
    });
  }
});

onLoad((options = {}) => {
  uni.setNavigationBarTitle({ title: APP_TITLE });
  const sharedResult = decodeSharedResult(options.s);
  if (sharedResult) {
    result.value = sharedResult;
  } else {
    const payload = uni.getStorageSync("salaryCalcResult");
    result.value = payload?.result || null;
  }
  updateSalaryRating();
});

onReady(() => {
  ready = true;
  drawDonutWhenReady();
});

// #ifdef MP-WEIXIN
onShareAppMessage(() => {
  const shareToken = encodeSharedResult(result.value);
  const path = shareToken ? `/pages/detail/index?s=${shareToken}` : "/pages/detail/index";
  return {
    title: APP_TITLE,
    path
  };
});

onShareTimeline(() => {
  const shareToken = encodeSharedResult(result.value);
  return {
    title: APP_TITLE,
    query: shareToken ? `s=${shareToken}` : ""
  };
});
// #endif

function encodeSharedResult(source) {
  if (!source) return "";
  try {
    const packed = {
      g: Number(source.grossSalary || 0),
      b: Number(source.annualBonus || 0),
      ag: Number(source.annualGrossIncome || 0),
      sd: Number(source.specialDeductionAnnual || 0),
      pm: Number(source.pensionMonthly || 0),
      mm: Number(source.medicalMonthly || 0),
      um: Number(source.unemploymentMonthly || 0),
      sm: Number(source.socialInsuranceMonthly || 0),
      hm: Number(source.housingFundMonthly || 0),
      sa: Number(source.socialInsuranceAnnual || 0),
      ha: Number(source.housingFundAnnual || 0),
      st: Number(source.salaryTaxAnnual || 0),
      bt: Number(source.bonusTax || 0),
      ta: Number(source.totalTaxAnnual || 0),
      ba: Number(source.bonusAfterTax || 0),
      na: Number(source.netAnnualSalary || 0),
      ah: Number(source.annualTakeHome || 0),
      tf: Number(source.totalIncomeWithFundAndBonus || 0),
      si: Array.isArray(source.specialDeductionItems)
        ? source.specialDeductionItems.map((item) => [String(item?.key || ""), String(item?.label || ""), Number(item?.amount || 0)])
        : [],
      md: Array.isArray(source.monthlyDetails)
        ? source.monthlyDetails.map((item) => [Number(item?.tax || 0), Number(item?.netSalary || 0)])
        : []
    };
    return encodeURIComponent(JSON.stringify(packed));
  } catch (error) {
    return "";
  }
}

function decodeSharedResult(token) {
  if (!token) return null;
  try {
    const packed = JSON.parse(decodeURIComponent(token));
    const monthlyDetails = Array.isArray(packed.md)
      ? packed.md.map((item, index) => ({
          month: `${index + 1}月`,
          tax: Number(item?.[0] || 0),
          netSalary: Number(item?.[1] || 0)
        }))
      : [];
    const specialDeductionItems = Array.isArray(packed.si)
      ? packed.si.map((item) => ({
          key: String(item?.[0] || ""),
          label: String(item?.[1] || "专项扣除"),
          amount: Number(item?.[2] || 0)
        }))
      : [];
    return {
      grossSalary: Number(packed.g || 0),
      annualBonus: Number(packed.b || 0),
      annualGrossIncome: Number(packed.ag || 0),
      specialDeductionAnnual: Number(packed.sd || 0),
      pensionMonthly: Number(packed.pm || 0),
      medicalMonthly: Number(packed.mm || 0),
      unemploymentMonthly: Number(packed.um || 0),
      socialInsuranceMonthly: Number(packed.sm || 0),
      housingFundMonthly: Number(packed.hm || 0),
      socialInsuranceAnnual: Number(packed.sa || 0),
      housingFundAnnual: Number(packed.ha || 0),
      salaryTaxAnnual: Number(packed.st || 0),
      bonusTax: Number(packed.bt || 0),
      totalTaxAnnual: Number(packed.ta || 0),
      bonusAfterTax: Number(packed.ba || 0),
      netAnnualSalary: Number(packed.na || 0),
      annualTakeHome: Number(packed.ah || 0),
      totalIncomeWithFundAndBonus: Number(packed.tf || 0),
      specialDeductionItems,
      monthlyDetails,
      bonusTaxMode: "separate"
    };
  } catch (error) {
    return null;
  }
}

function drawDonutWhenReady() {
  if (!ready || !result.value || !chartItems.value.length) return;
  nextTick(() => drawDonut());
}

function drawDonut() {
  const ctx = uni.createCanvasContext("incomePie");
  const cx = CHART_CENTER;
  const cy = CHART_CENTER;
  const radius = CHART_RADIUS;
  const lineWidth = CHART_LINE_WIDTH;

  const total = chartItems.value.reduce((sum, item) => sum + item.value, 0);
  ctx.clearRect(0, 0, CHART_SIZE, CHART_SIZE);

  if (total <= 0) {
    ctx.setStrokeStyle("#e5e7eb");
    ctx.setLineWidth(lineWidth);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.draw();
    return;
  }

  let start = -Math.PI / 2;
  chartItems.value.forEach((item) => {
    const angle = (item.value / total) * Math.PI * 2;
    const end = start + angle;

    ctx.setLineWidth(lineWidth);
    ctx.setLineCap("round");
    ctx.setStrokeStyle(item.color);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();

    start = end;
  });

  ctx.setFillStyle("#8b95a7");
  ctx.setFontSize(12);
  ctx.setTextAlign("center");
  ctx.fillText("现金占比", cx, cy - 6);

  ctx.setFillStyle("#1f2937");
  ctx.setFontSize(22);
  ctx.fillText(`${centerPercent.value}%`, cx, cy + 20);

  ctx.draw();
}

function goBack() {
  uni.navigateBack({ delta: 1 });
}

function money(v) {
  return `¥${plainMoney(v)}`;
}

function plainMoney(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "0";
}

function roundedPercent(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function openHelloCoder() {
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(HELLO_CODER_QR_URL, "_blank");
    return;
  }
  uni.previewImage({
    current: HELLO_CODER_QR_URL,
    urls: [HELLO_CODER_QR_URL]
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f4f6;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 24rpx 24rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 22rpx 22rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #e5e7eb;
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.06);
}

.section-kicker {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  margin-bottom: 10rpx;
}

.hero-card {
  position: relative;
  padding: 32rpx 28rpx 26rpx;
  background: linear-gradient(180deg, #fff1f2 0%, #ffffff 100%);
  border: 1rpx solid #fecdd3;
  box-shadow: 0 10rpx 30rpx rgba(239, 68, 68, 0.08);
}

.rating-bubble {
  position: absolute;
  top: -10rpx;
  right: 10rpx;
  z-index: 2;
  transform: rotate(-8deg);
  background: linear-gradient(135deg, rgba(255, 251, 253, 0.92) 0%, rgba(255, 244, 248, 0.9) 100%);
  border: 1rpx solid rgba(244, 114, 182, 0.28);
  border-radius: 18rpx;
  padding: 10rpx 14rpx;
  box-shadow: 0 6rpx 12rpx rgba(244, 114, 182, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  text-align: center;
  min-width: 210rpx;
}

.rating-bubble::before {
  content: none;
}

.rating-bubble::after {
  content: "";
  position: absolute;
  left: -10rpx;
  top: 55%;
  width: 12rpx;
  height: 12rpx;
  background: rgba(255, 247, 250, 0.92);
  border-left: 1rpx solid rgba(244, 114, 182, 0.28);
  border-bottom: 1rpx solid rgba(244, 114, 182, 0.28);
  transform: translateY(-50%) rotate(45deg);
}

.rating-title {
  font-size: 22rpx;
  color: #be185d;
  font-weight: 800;
  letter-spacing: 1rpx;
  line-height: 1;
}

.rating-percent {
  font-size: 17rpx;
  color: #db2777;
  line-height: 1.2;
}

.rating-percent-num {
  font-weight: 700;
}

.hero-main {
  display: flex;
  align-items: stretch;
  margin-bottom: 20rpx;
  margin-top: 6rpx;
}

.hero-main-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  position: relative;
}

.hero-main-item:last-child {
  align-items: flex-end;
  text-align: right;
}

.hero-main-item:last-child .hero-label-row {
  justify-content: flex-end;
}

.hero-main-divider {
  width: 1rpx;
  background: #fecdd3;
  margin: 0 24rpx;
}

.hero-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  letter-spacing: 1rpx;
  margin-bottom: 4rpx;
}

.hero-label-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.hero-tag {
  font-size: 16rpx;
  line-height: 1;
  color: #b91c1c;
  background: #fee2e2;
  border: 1rpx solid #fecaca;
  border-radius: 999rpx;
  padding: 4rpx 8rpx;
}

.hero-tag.all-in {
  color: #7f1d1d;
  background: #fecaca;
}

.hero-amount {
  display: block;
  font-size: 60rpx;
  font-weight: 800;
  color: #dc2626;
  line-height: 1.1;
  letter-spacing: 1rpx;
}

.hero-amount.alt {
  color: #dc2626;
}

.hero-hint {
  display: block;
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.hero-sub {
  display: flex;
  align-items: stretch;
  padding-top: 18rpx;
  border-top: 1rpx dashed #fecdd3;
}

.hero-sub-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.hero-sub-item:last-child {
  align-items: flex-end;
  text-align: right;
}

.hero-sub-label {
  font-size: 22rpx;
  color: #64748b;
}

.hero-sub-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #b91c1c;
}

.hero-divider {
  width: 1rpx;
  background: #e5e7eb;
  margin: 0 20rpx;
}

@media (max-width: 480px) {
  .rating-bubble {
    top: -8rpx;
    right: -84rpx;
    padding: 8rpx 10rpx;
    min-width: 158rpx;
  }

  .rating-title {
    font-size: 20rpx;
  }

  .rating-percent {
    font-size: 16rpx;
  }

  .hero-amount {
    font-size: 46rpx;
  }

  .hero-label {
    font-size: 20rpx;
  }

  .hero-hint {
    font-size: 18rpx;
  }

  .hero-main-divider {
    margin: 0 12rpx;
  }
}

.bill-card {
  padding: 24rpx 24rpx 20rpx;
}

.bill-title {
  display: block;
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 14rpx;
  letter-spacing: 1rpx;
}

.bill-row {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx dashed #eef2f7;
}

.bill-row:last-child {
  border-bottom: none;
}

.bill-op {
  flex: 0 0 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: #94a3b8;
  font-weight: 500;
}

.bill-name {
  flex: 1;
  font-size: 26rpx;
  color: #334155;
}

.bill-value {
  flex: 0 0 auto;
  font-size: 28rpx;
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

.bill-row.plus .bill-op {
  color: #ef4444;
}

.bill-row.plus .bill-value {
  color: #dc2626;
}

.bill-row.minus .bill-op {
  color: #22c55e;
}

.bill-row.minus .bill-value {
  color: #16a34a;
}

.bill-row.subtotal {
  background: transparent;
  border-radius: 0;
  border-top: 2rpx solid #fecdd3;
  border-bottom: none;
  margin-top: 10rpx;
  padding: 18rpx 0 8rpx;
}

.bill-row.subtotal .bill-op {
  color: #0f172a;
  font-weight: 700;
}

.bill-row.subtotal .bill-name {
  color: #0f172a;
  font-weight: 700;
  font-size: 28rpx;
}

.bill-row.subtotal .bill-value {
  font-size: 38rpx;
  color: #dc2626;
  font-weight: 800;
}

.bill-row.result {
  border-top: 2rpx solid #e2e8f0;
  border-bottom: none;
  margin-top: 6rpx;
  padding: 16rpx 0 8rpx;
}

.bill-row.result .bill-op {
  color: #0f172a;
  font-weight: 700;
}

.bill-row.result .bill-name {
  color: #0f172a;
  font-weight: 700;
  font-size: 28rpx;
}

.bill-row.result.mid .bill-value {
  font-size: 34rpx;
  color: #dc2626;
  font-weight: 800;
}

.bill-row.result.mid {
  border-top: 2rpx solid #bbf7d0;
}

.bill-row.result.final {
  border-top: 2rpx solid #fecdd3;
  margin-top: 10rpx;
  padding-top: 18rpx;
}

.bill-row.result.final .bill-value {
  font-size: 38rpx;
  color: #dc2626;
  font-weight: 800;
}

.analysis-title-wrap {
  display: flex;
  align-items: center;
  margin-bottom: 14rpx;
}

.analysis-title {
  font-size: 34rpx;
  color: #0f172a;
  font-weight: 700;
  line-height: 1.3;
}

.chart-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26rpx;
  width: 100%;
}

.canvas-wrap {
  position: relative;
  flex-shrink: 0;
  margin-left: 0;
  margin-top: 0;
  width: 240px;
  height: 240px;
}

.pie-canvas {
  width: 240px;
  height: 240px;
}

.legend-wrap {
  flex: 0 0 340rpx;
  min-width: 340rpx;
  padding-top: 6rpx;
  padding-left: 0;
  margin-left: 0;
}

.legend-item {
  margin-bottom: 14rpx;
}

.legend-top {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

.legend-name {
  flex: 0 1 auto;
  min-width: 0;
  color: #334155;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend-percent {
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1.2;
  flex-shrink: 0;
  margin-left: 2rpx;
}

.legend-amount {
  display: block;
  margin-left: 26rpx;
  margin-top: 2rpx;
  color: #334155;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 1.3;
  white-space: nowrap;
}

.summary-rows {
  margin-top: 6rpx;
}

.summary-card .summary-rows {
  margin-top: 0;
}

.sum-section {
  border-bottom: 1rpx solid #eef2f7;
  padding: 4rpx 0 10rpx;
}

.sum-section:last-of-type {
  border-bottom: none;
  padding-bottom: 6rpx;
}

.sum-section .sum-row {
  border-bottom: none;
  padding-bottom: 6rpx;
}

.sum-detail {
  margin: 4rpx 0 14rpx;
  padding: 16rpx 18rpx;
  background: #f8fafc;
  border: 1rpx solid #eef2f7;
  border-radius: 12rpx;
}

.detail-title {
  display: block;
  font-size: 24rpx;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 12rpx;
  line-height: 1.3;
}

.chart-detail {
  padding: 10rpx 12rpx 12rpx;
}

.chart-detail .detail-title {
  margin-bottom: 6rpx;
}

.ledger-detail {
  padding: 14rpx 18rpx;
}

.ledger-row {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr 0.9fr;
  column-gap: 16rpx;
  align-items: center;
  padding: 10rpx 0;
  border-bottom: 1rpx dashed #e5e7eb;
}

.ledger-row:last-child {
  border-bottom: none;
}

.ledger-header {
  padding: 6rpx 0;
  border-bottom: 1rpx solid #e5e7eb;
}

.ledger-header text {
  font-size: 20rpx !important;
  color: #94a3b8 !important;
  font-weight: 500 !important;
}

.ledger-name {
  min-width: 0;
  font-size: 26rpx;
  color: #334155;
  font-weight: 500;
  text-align: left;
}

.ledger-calc {
  min-width: 0;
  text-align: left;
  font-size: 22rpx;
  color: #94a3b8;
}

.ledger-total {
  min-width: 0;
  font-size: 28rpx;
  color: #0f172a;
  font-weight: 600;
  text-align: left;
}

.ledger-sum {
  margin-top: 4rpx;
  padding-top: 12rpx;
  border-top: 2rpx solid #e2e8f0;
  border-bottom: none;
}

.ledger-sum .ledger-name {
  color: #0f172a;
  font-weight: 700;
}

.ledger-sum .ledger-total {
  color: #16a34a;
  font-weight: 700;
}

.gross-sum-row .ledger-total {
  color: #dc2626;
}

.housing-sum-row .ledger-total {
  color: #dc2626;
}

.table-detail {
  padding: 14rpx 14rpx 18rpx;
}

.table-detail .col {
  font-size: 24rpx;
  line-height: 1.35;
}

.table-detail .table-head .col {
  font-size: 22rpx;
}

.bonus-row .col.month {
  color: #0f172a;
  font-weight: 500;
  text-align: left;
}

.bonus-row .col.tax.red {
  color: #16a34a;
}

.bonus-row .col.take {
  color: #dc2626;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 14rpx 0;
  font-size: 30rpx;
  color: #1e293b;
}

.sum-row:not(.sum-row-toggle) text:first-child {
  font-size: 34rpx;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.3;
}

.sum-row:not(.sum-row-toggle) text:last-child {
  font-size: 40rpx;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
}

.sum-row-toggle {
  align-items: center;
}

.summary-toggle {
  justify-content: center;
  gap: 10rpx;
  padding: 8rpx 0 12rpx;
  border-bottom: 1rpx solid #eef2f7;
  margin-bottom: 8rpx;
}

.summary-toggle .sum-row-title {
  min-width: auto;
}

.sum-row-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.sum-row-title text {
  font-size: 34rpx;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.3;
}

.sum-row-amount {
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.sum-row-toggle.sum-row.red .sum-row-amount {
  color: #16a34a;
}

.sum-row-toggle.sum-row.income .sum-row-amount {
  color: #dc2626;
}

.toggle-icon {
  width: 14rpx;
  height: 14rpx;
  border-right: 3rpx solid #64748b;
  border-bottom: 3rpx solid #64748b;
  transform: rotate(45deg);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.toggle-icon.open {
  transform: rotate(-135deg);
}

.sum-row.muted {
  color: #64748b;
}

.sum-row.muted text {
  font-size: 26rpx !important;
  color: #64748b !important;
  font-weight: 500 !important;
}

.sum-row.red {
  color: #16a34a;
}

.sum-row.red text:first-child {
  color: #1e293b;
}

.sum-row.red text:last-child {
  color: #16a34a;
}

.sum-row-heading text:first-child {
  font-size: 34rpx;
  font-weight: 600;
  color: #1e293b;
}

.sum-row-heading text:last-child {
  font-size: 34rpx;
}

.special-deduction-row text:first-child {
  color: #0f172a;
  font-weight: 600;
}

.special-deduction-row text:last-child {
  color: #0f172a;
}

.special-deduction-sum-row .ledger-total {
  color: #0f172a;
}

.formula-section .sum-row {
  padding-bottom: 2rpx;
}

.formula-title-row text:first-child {
  color: #0f172a;
  font-weight: 600;
}

.formula-detail {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.formula-card {
  background: #ffffff;
  border: 1rpx solid #e5e7eb;
  border-radius: 10rpx;
  padding: 12rpx 14rpx;
}

.formula-name {
  display: block;
  font-size: 28rpx;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.35;
}

.formula-exp {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.45;
}

.formula-exp-total {
  margin-top: 10rpx;
  padding-top: 10rpx;
  border-top: 1rpx dashed #e2e8f0;
  color: #334155;
  font-weight: 600;
}

.formula-help {
  display: inline-block;
  margin-left: 8rpx;
  width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  border-radius: 50%;
  text-align: center;
  font-size: 20rpx;
  color: #0ea5e9;
  border: 1rpx solid #bae6fd;
}

.formula-help-inline {
  margin-left: 4rpx;
  margin-right: 0;
  vertical-align: middle;
  width: 26rpx;
  height: 26rpx;
  line-height: 26rpx;
  font-size: 18rpx;
}

.tax-rate-modal-source {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.45;
  padding: 0 20rpx 14rpx;
}

.bonus-rate-head .col.range {
  font-size: 20rpx;
}

.tax-rate-modal-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.48);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 24rpx;
}

.tax-rate-modal {
  width: 100%;
  max-width: 760rpx;
  background: #ffffff;
  border-radius: 18rpx;
  overflow: hidden;
}

.tax-rate-modal-title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  color: #0f172a;
  font-weight: 700;
  padding: 22rpx 20rpx 16rpx;
}

.tax-rate-head,
.tax-rate-row {
  display: flex;
  align-items: center;
  padding: 12rpx 18rpx;
  border-top: 1rpx solid #eef2f7;
}

.tax-rate-head {
  background: #f8fafc;
}

.tax-rate-head .col {
  font-size: 22rpx;
  color: #64748b;
  font-weight: 600;
}

.tax-rate-row .col {
  font-size: 22rpx;
  color: #334155;
  line-height: 1.35;
}

.tax-rate-row.active {
  background: #eff6ff;
  border-left: 6rpx solid #0ea5e9;
}

.tax-rate-row.active .col {
  color: #0f172a;
  font-weight: 600;
}

.tax-rate-row .col.level,
.tax-rate-head .col.level {
  width: 12%;
  text-align: center;
}

.tax-rate-row .col.range,
.tax-rate-head .col.range {
  width: 52%;
}

.tax-rate-row .col.rate,
.tax-rate-head .col.rate {
  width: 18%;
  text-align: center;
}

.tax-rate-row .col.quick,
.tax-rate-head .col.quick {
  width: 18%;
  text-align: center;
}

.tax-rate-close {
  margin: 12rpx 18rpx 18rpx;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 12rpx;
  background: #0ea5e9;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
}

.sum-row.income text:last-child {
  color: #dc2626;
}

.sum-row.strong {
  color: #0f172a;
  font-weight: 700;
}

.sum-row.strong text:first-child {
  color: #0f172a;
  font-weight: 600;
}

.sum-row.strong text:last-child {
  font-size: 38rpx;
  font-weight: 800;
  color: #0f172a;
}

.income-formula-line {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.4;
}

.income-formula {
  margin-top: 6rpx;
  padding: 0;
  text-align: center;
}

.income-formula-title {
  display: block;
  margin-top: 0;
  font-size: 19rpx;
  color: #94a3b8;
  line-height: 1.4;
  text-align: center;
}

.income-formula-link {
  color: #64748b;
  text-decoration: underline;
}

.income-formula-gap {
  margin-top: 10rpx;
}

.income-formula-sub {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.5;
}

.income-formula-result {
  display: block;
  font-size: 24rpx;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.5;
}

.table-title {
  display: block;
  font-size: 36rpx;
  color: #0f172a;
  font-weight: 600;
  margin-bottom: 16rpx;
  line-height: 1.3;
}

.row {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #eef2f7;
  padding: 14rpx 0;
}

.table-head {
  background: #ffffff;
  border-radius: 10rpx;
  padding: 10rpx 10rpx;
  border: 1rpx solid #e2e8f0;
}

.table-row {
  padding: 12rpx 10rpx;
}

.total-row {
  border-bottom: none;
  border-top: 2rpx solid #e2e8f0;
  margin-top: 6rpx;
}

.total-row .col {
  font-weight: 700;
  color: #0f172a;
}

.total-row .col.tax.red {
  color: #16a34a;
}

.total-row-primary .col.take {
  color: #dc2626;
}

.total-row-primary,
.total-row-bonus {
  margin: 8rpx -14rpx 0;
  padding: 12rpx 14rpx;
  border-radius: 10rpx;
  border: 1rpx solid #cbd5e1;
  border-top: none;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.total-row-bonus .col.take {
  color: #dc2626;
}

.col {
  font-size: 30rpx;
  line-height: 1.4;
}

.table-head .col {
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
}

.col.month {
  width: 20%;
  color: #64748b;
  font-weight: 500;
}

.col.tax {
  width: 20%;
  text-align: center;
  color: #334155;
}

.table-row .col.tax {
  font-weight: 700;
}

.col.fund {
  width: 20%;
  text-align: center;
  color: #334155;
}

.col.insurance {
  width: 20%;
  text-align: center;
  color: #334155;
}

.col.take {
  width: 20%;
  text-align: right;
  color: #1e293b;
  font-weight: 600;
}

.red {
  color: #16a34a;
}

.empty {
  text-align: center;
  color: #4b5563;
}

.back-btn {
  margin-top: 16rpx;
  background: #ffffff;
  color: #0f172a;
  border: 2rpx solid #e5e7eb;
}

@media (min-width: 1024px) {
  .content {
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .chart-wrap {
    flex-direction: row;
    align-items: center;
    gap: 14rpx;
    justify-content: center;
  }

  .legend-wrap {
    flex: 0 0 300rpx;
    min-width: 300rpx;
    width: auto;
    padding-top: 0;
    border-top: none;
  }

  .pie-canvas {
    width: 200px;
    height: 200px;
  }

  .canvas-wrap {
    width: 200px;
    height: 200px;
  }

  .table-detail .col {
    font-size: 22rpx;
    white-space: nowrap;
  }

  .table-detail .table-head .col {
    font-size: 20rpx;
  }

  .table-detail .col.month {
    width: 24%;
  }

  .table-detail .col.insurance,
  .table-detail .col.fund {
    width: 19%;
  }

  .table-detail .col.tax {
    width: 19%;
    text-align: right;
    padding-right: 8rpx;
  }

  .table-detail .col.take {
    width: 19%;
  }
}
</style>



