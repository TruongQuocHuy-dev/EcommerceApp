import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Text as SvgText, Circle } from 'react-native-svg';

import api from '../../api/client';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 2 * SPACING.md - 32; // Accommodate card padding
const CHART_HEIGHT = 160;

// Color Palette for Reports
const REPORT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('vi-VN') + 'đ';
};

// --- Custom SVG Area Chart Component ---
const CustomAreaChart = ({ data }: { data: { date: string; revenue: number; orders: number }[] }) => {
    if (!data || data.length === 0) return null;

    const maxRevenue = Math.max(...data.map(d => d.revenue), 100000);
    const len = data.length;
    const paddingX = 15;
    const paddingY = 20;

    // Build coordinates
    const points = data.map((item, idx) => {
        const x = paddingX + (idx / (len - 1 || 1)) * (CHART_WIDTH - 2 * paddingX);
        // Invert Y because SVG coordinates start from top
        const y = CHART_HEIGHT - paddingY - (item.revenue / maxRevenue) * (CHART_HEIGHT - 2 * paddingY);
        return { x, y, date: item.date, revenue: item.revenue };
    });

    // Generate Path string for line
    let pathD = '';
    if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }
    }

    // Generate Path string for gradient fill
    const fillD = pathD ? `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT - paddingY} L ${points[0].x} ${CHART_HEIGHT - paddingY} Z` : '';

    return (
        <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                    <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * (CHART_HEIGHT - 2 * paddingY);
                    return (
                        <Path
                            key={`grid-${idx}`}
                            d={`M ${paddingX} ${y} L ${CHART_WIDTH - paddingX} ${y}`}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="3, 3"
                        />
                    );
                })}

                {/* Area Fill */}
                {fillD ? <Path d={fillD} fill="url(#areaGrad)" /> : null}

                {/* Line Path */}
                {pathD ? <Path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2.5" /> : null}

                {/* Data Points / Circles */}
                {points.map((pt, idx) => (
                    <Circle
                        key={`pt-${idx}`}
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#fff"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                    />
                ))}

                {/* Date Labels (only show first, middle, last to avoid crowding) */}
                {points.length > 0 && (
                    <>
                        <SvgText
                            x={points[0].x}
                            y={CHART_HEIGHT - 4}
                            fontSize="9"
                            fill="#94a3b8"
                            textAnchor="start"
                            fontWeight="500"
                        >
                            {points[0].date.substring(5)}
                        </SvgText>
                        {points.length > 2 && (
                            <SvgText
                                x={points[Math.floor(points.length / 2)].x}
                                y={CHART_HEIGHT - 4}
                                fontSize="9"
                                fill="#94a3b8"
                                textAnchor="middle"
                                fontWeight="500"
                            >
                                {points[Math.floor(points.length / 2)].date.substring(5)}
                            </SvgText>
                        )}
                        <SvgText
                            x={points[points.length - 1].x}
                            y={CHART_HEIGHT - 4}
                            fontSize="9"
                            fill="#94a3b8"
                            textAnchor="end"
                            fontWeight="500"
                        >
                            {points[points.length - 1].date.substring(5)}
                        </SvgText>
                    </>
                )}
            </Svg>
        </View>
    );
};

// --- Custom SVG Bar Chart for Orders ---
const CustomBarChart = ({ data }: { data: { date: string; revenue: number; orders: number }[] }) => {
    if (!data || data.length === 0) return null;

    const maxOrders = Math.max(...data.map(d => d.orders), 5);
    const len = data.length;
    const paddingX = 15;
    const paddingY = 20;

    const chartInnerWidth = CHART_WIDTH - 2 * paddingX;
    const barWidth = Math.max(4, Math.min(20, (chartInnerWidth / len) * 0.5));
    const stepX = chartInnerWidth / (len - 1 || 1);

    return (
        <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * (CHART_HEIGHT - 2 * paddingY);
                    return (
                        <Path
                            key={`grid-${idx}`}
                            d={`M ${paddingX} ${y} L ${CHART_WIDTH - paddingX} ${y}`}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="3, 3"
                        />
                    );
                })}

                {/* Bars */}
                {data.map((item, idx) => {
                    const x = paddingX + idx * stepX - barWidth / 2;
                    const barHeight = (item.orders / maxOrders) * (CHART_HEIGHT - 2 * paddingY);
                    const y = CHART_HEIGHT - paddingY - barHeight;

                    return (
                        <Rect
                            key={`bar-${idx}`}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill="#10b981"
                            rx="2"
                        />
                    );
                })}

                {/* Date Labels (only show first, middle, last) */}
                {data.length > 0 && (
                    <>
                        <SvgText
                            x={paddingX}
                            y={CHART_HEIGHT - 4}
                            fontSize="9"
                            fill="#94a3b8"
                            textAnchor="start"
                            fontWeight="500"
                        >
                            {data[0].date.substring(5)}
                        </SvgText>
                        {data.length > 2 && (
                            <SvgText
                                x={paddingX + Math.floor(data.length / 2) * stepX}
                                y={CHART_HEIGHT - 4}
                                fontSize="9"
                                fill="#94a3b8"
                                textAnchor="middle"
                                fontWeight="500"
                            >
                                {data[Math.floor(data.length / 2)].date.substring(5)}
                            </SvgText>
                        )}
                        <SvgText
                            x={CHART_WIDTH - paddingX}
                            y={CHART_HEIGHT - 4}
                            fontSize="9"
                            fill="#94a3b8"
                            textAnchor="end"
                            fontWeight="500"
                        >
                            {data[data.length - 1].date.substring(5)}
                        </SvgText>
                    </>
                )}
            </Svg>
        </View>
    );
};

// --- Main Reports Component ---
const SellerReportsScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'products' | 'orders'>('overview');
    const [period, setPeriod] = useState<'last7days' | 'last30days' | 'thisMonth'>('last7days');

    const [overviewData, setOverviewData] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [productsData, setProductsData] = useState<any[]>([]);
    const [orderStats, setOrderStats] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch reports data
    const fetchReportsData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewRes, revenueRes, productsRes, ordersRes] = await Promise.all([
                api.get('/analytics/seller/overview'),
                api.get(`/analytics/seller/revenue?period=${period}`),
                api.get('/analytics/seller/products?limit=10'),
                api.get('/analytics/seller/orders'),
            ]);

            if (overviewRes.data?.success) setOverviewData(overviewRes.data.data);
            if (revenueRes.data?.success) setRevenueData(revenueRes.data.data);
            if (productsRes.data?.success) setProductsData(productsRes.data.data);
            if (ordersRes.data?.success) setOrderStats(ordersRes.data.data);
        } catch (error) {
            console.error('Error fetching seller reports data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => {
        fetchReportsData();
    }, [fetchReportsData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReportsData();
    };

    // --- Sub-renderers ---

    const renderOverviewTab = () => {
        const totalProductsSold = productsData.reduce((acc, curr) => acc + curr.totalSold, 0);

        return (
            <View style={styles.tabContent}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#ede9fe' }]}>
                            <Icon name="currency-usd" size={20} color="#8b5cf6" />
                        </View>
                        <Text style={styles.statLabel}>Doanh thu</Text>
                        <Text style={styles.statVal} numberOfLines={1}>
                            {formatCurrency(overviewData?.totalRevenue || 0)}
                        </Text>
                        {overviewData?.revenueGrowth !== undefined && (
                            <View style={styles.trendRow}>
                                <Icon
                                    name={overviewData.revenueGrowth >= 0 ? "trending-up" : "trending-down"}
                                    size={14}
                                    color={overviewData.revenueGrowth >= 0 ? '#10b981' : '#ef4444'}
                                />
                                <Text style={[styles.trendText, { color: overviewData.revenueGrowth >= 0 ? '#10b981' : '#ef4444' }]}>
                                    {overviewData.revenueGrowth >= 0 ? '+' : ''}{overviewData.revenueGrowth}%
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#e0f2fe' }]}>
                            <Icon name="clipboard-text-outline" size={20} color="#0284c7" />
                        </View>
                        <Text style={styles.statLabel}>Đơn hàng</Text>
                        <Text style={styles.statVal}>{(overviewData?.totalOrders || 0).toLocaleString()}</Text>
                        {overviewData?.ordersGrowth !== undefined && (
                            <View style={styles.trendRow}>
                                <Icon
                                    name={overviewData.ordersGrowth >= 0 ? "trending-up" : "trending-down"}
                                    size={14}
                                    color={overviewData.ordersGrowth >= 0 ? '#10b981' : '#ef4444'}
                                />
                                <Text style={[styles.trendText, { color: overviewData.ordersGrowth >= 0 ? '#10b981' : '#ef4444' }]}>
                                    {overviewData.ordersGrowth >= 0 ? '+' : ''}{overviewData.ordersGrowth}%
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#dcfce7' }]}>
                            <Icon name="package-variant" size={20} color="#15803d" />
                        </View>
                        <Text style={styles.statLabel}>Sản phẩm trực tuyến</Text>
                        <Text style={styles.statVal}>{(overviewData?.totalProducts || 0).toLocaleString()}</Text>
                        <Text style={styles.statSubText}>{totalProductsSold} sản phẩm đã bán</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#fee2e2' }]}>
                            <Icon name="close-circle-outline" size={20} color="#b91c1c" />
                        </View>
                        <Text style={styles.statLabel}>Tỷ lệ hủy đơn</Text>
                        <Text style={[styles.statVal, { color: COLORS.error }]}>
                            {overviewData?.cancellationRate || 0}%
                        </Text>
                        <Text style={styles.statSubText}>Tổng hủy: {overviewData?.canceledOrders || 0} đơn</Text>
                    </View>
                </View>

                {/* Sales Chart Container */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Xu hướng doanh thu</Text>
                        <Text style={styles.cardSubTitle}>Biến động dòng tiền thực nhận (đã hoàn thành)</Text>
                    </View>
                    {revenueData?.chartData && revenueData.chartData.length > 0 ? (
                        <CustomAreaChart data={revenueData.chartData} />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Icon name="alert-circle-outline" size={28} color={COLORS.text.muted} />
                            <Text style={styles.emptyText}>Chưa có dữ liệu giao dịch trong kỳ</Text>
                        </View>
                    )}
                </View>

                {/* Status Bar */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Tình trạng xử lý đơn hàng</Text>
                        <Text style={styles.cardSubTitle}>Phân bố tỷ lệ xử lý đơn hàng của Shop</Text>
                    </View>
                    {orderStats && orderStats.length > 0 ? (
                        <View style={styles.statusSection}>
                            {/* Visual distribution horizontal bar */}
                            <View style={styles.stackedBar}>
                                {orderStats.map((item, idx) => {
                                    const total = overviewData?.totalOrders || 1;
                                    const flex = total > 0 ? item.count / total : 0;
                                    if (flex === 0) return null;
                                    return (
                                        <View
                                            key={`bar-segment-${idx}`}
                                            style={{
                                                flex,
                                                backgroundColor: REPORT_COLORS[idx % REPORT_COLORS.length],
                                                height: '100%',
                                            }}
                                        />
                                    );
                                })}
                            </View>
                            {/* Details list */}
                            <View style={styles.statusDetailsList}>
                                {orderStats.map((item, idx) => {
                                    const total = overviewData?.totalOrders || 1;
                                    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                    const labels: Record<string, string> = {
                                        pending: 'Chờ xác nhận',
                                        processing: 'Đang xử lý',
                                        shipped: 'Đang giao',
                                        delivered: 'Đã giao',
                                        cancelled: 'Đã hủy',
                                    };

                                    return (
                                        <View key={`status-row-${idx}`} style={styles.statusRow}>
                                            <View style={styles.statusLeft}>
                                                <View style={[styles.dot, { backgroundColor: REPORT_COLORS[idx % REPORT_COLORS.length] }]} />
                                                <Text style={styles.statusName}>{labels[item.status] || item.status}</Text>
                                            </View>
                                            <Text style={styles.statusCount}>
                                                {item.count} đơn ({percent}%)
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>Không có dữ liệu trạng thái đơn hàng</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderRevenueTab = () => {
        const chartData = revenueData?.chartData || [];
        const deliveredCount = overviewData?.deliveredOrders || 1;
        const averageOrderValue = Math.round((overviewData?.totalRevenue || 0) / deliveredCount);

        return (
            <View style={styles.tabContent}>
                {/* Revenue Overview metrics */}
                <View style={styles.revenueHeroCard}>
                    <Text style={styles.revenueHeroLabel}>Doanh thu trong kỳ</Text>
                    <Text style={styles.revenueHeroVal}>{formatCurrency(revenueData?.totalRevenue || 0)}</Text>
                    <View style={styles.revenueHeroFooter}>
                        <View style={styles.revenueSubItem}>
                            <Text style={styles.revenueSubLabel}>Tổng đơn thành công</Text>
                            <Text style={styles.revenueSubVal}>{revenueData?.totalOrders || 0} đơn</Text>
                        </View>
                        <View style={styles.dividerVertical} />
                        <View style={styles.revenueSubItem}>
                            <Text style={styles.revenueSubLabel}>Giá trị đơn TB (AOV)</Text>
                            <Text style={styles.revenueSubVal}>{formatCurrency(averageOrderValue)}</Text>
                        </View>
                    </View>
                </View>

                {/* Interactive bar/line chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Thống kê lượng đơn theo ngày</Text>
                        <Text style={styles.cardSubTitle}>Biểu thị số lượng đơn đặt mua hàng ngày</Text>
                    </View>
                    {chartData.length > 0 ? (
                        <CustomBarChart data={chartData} />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>Chưa có thông tin đơn hàng</Text>
                        </View>
                    )}
                </View>

                {/* Table details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Chi tiết doanh thu theo ngày</Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol, { flex: 1.5 }]}>Ngày</Text>
                        <Text style={[styles.tableCol, { textAlign: 'center' }]}>Số đơn</Text>
                        <Text style={[styles.tableCol, { textAlign: 'right', flex: 1.5 }]}>Doanh thu</Text>
                    </View>
                    {chartData.length > 0 ? (
                        chartData.slice().reverse().map((item: any, idx: number) => (
                            <View key={`row-${idx}`} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700' }]}>{item.date}</Text>
                                <Text style={[styles.tableCell, { textAlign: 'center' }]}>{item.orders}</Text>
                                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1.5, color: '#8b5cf6', fontWeight: '800' }]}>
                                    {formatCurrency(item.revenue)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyRow}>
                            <Text style={styles.emptyText}>Không có dữ liệu chi tiết</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderProductsTab = () => {
        const topSoldVal = productsData[0]?.totalSold || 1;

        return (
            <View style={styles.tabContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Xếp hạng sản phẩm bán chạy</Text>
                        <Text style={styles.cardSubTitle}>Top 10 sản phẩm đạt sản lượng lớn nhất</Text>
                    </View>

                    {productsData.length > 0 ? (
                        productsData.map((item, idx) => {
                            const percent = Math.min(100, Math.round((item.totalSold / topSoldVal) * 100));

                            return (
                                <View key={item._id || idx} style={styles.productRankItem}>
                                    <View style={styles.rankNumBox}>
                                        <Text style={[styles.rankNum, idx < 3 && styles.topRankNum]}>#{idx + 1}</Text>
                                    </View>
                                    <Image
                                        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                                        style={styles.productImg}
                                    />
                                    <View style={styles.productMeta}>
                                        <Text style={styles.productName} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.productCategory}>{item.category}</Text>
                                        {/* Horizontal progress bar */}
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                                        </View>
                                        <View style={styles.productMetrics}>
                                            <Text style={styles.metricText}>Đã bán: <Text style={{ fontWeight: '700', color: COLORS.text.primary }}>{item.totalSold}</Text></Text>
                                            <Text style={styles.metricText}>Doanh thu: <Text style={{ fontWeight: '700', color: '#8b5cf6' }}>{formatCurrency(item.totalRevenue)}</Text></Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyRow}>
                            <Icon name="package-variant" size={36} color={COLORS.text.muted} />
                            <Text style={styles.emptyText}>Shop chưa bán được sản phẩm nào.</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderOrdersTab = () => {
        const total = overviewData?.totalOrders || 0;
        const pending = overviewData?.pendingOrders || 0;
        const delivered = overviewData?.deliveredOrders || 0;
        const cancelled = overviewData?.canceledOrders || 0;
        const shippingOrProcessing = Math.max(0, total - pending - delivered - cancelled);

        const STATUS_CARDS = [
            { label: 'Chờ xác nhận', count: pending, color: '#f59e0b', bg: '#fef3c7', icon: 'clock-outline' },
            { label: 'Đang xử lý/giao', count: shippingOrProcessing, color: '#3b82f6', bg: '#dbeafe', icon: 'truck-delivery-outline' },
            { label: 'Giao thành công', count: delivered, color: '#10b981', bg: '#d1fae5', icon: 'check-circle-outline' },
            { label: 'Đã hủy đơn', count: cancelled, color: '#ef4444', bg: '#fee2e2', icon: 'close-circle-outline' },
        ];

        return (
            <View style={styles.tabContent}>
                {/* Status card list */}
                <View style={styles.ordersGrid}>
                    {STATUS_CARDS.map((card, idx) => (
                        <View key={`card-${idx}`} style={styles.orderStatusCard}>
                            <View style={[styles.orderIconBgWrap, { backgroundColor: card.bg }]}>
                                <Icon name={card.icon} size={22} color={card.color} />
                            </View>
                            <View style={styles.orderCardInfo}>
                                <Text style={styles.orderCardLabel}>{card.label}</Text>
                                <Text style={[styles.orderCardVal, { color: card.color }]}>
                                    {card.count.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Conversion Rate Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Phân tích chuyển đổi</Text>
                        <Text style={styles.cardSubTitle}>Tỷ số phân bố trên tổng đơn hàng của gian hàng</Text>
                    </View>
                    <View style={styles.conversionSection}>
                        {[
                            { name: 'Hoàn thành', rate: total > 0 ? (delivered / total) * 100 : 0, color: '#10b981' },
                            { name: 'Bị hủy', rate: total > 0 ? (cancelled / total) * 100 : 0, color: '#ef4444' },
                            { name: 'Khác', rate: total > 0 ? (100 - ((delivered + cancelled) / total) * 100) : 0, color: '#94a3b8' },
                        ].map((item, idx) => (
                            <View key={`conv-${idx}`} style={styles.convRow}>
                                <View style={styles.convMeta}>
                                    <Text style={styles.convLabel}>{item.name}</Text>
                                    <Text style={[styles.convVal, { color: item.color }]}>{item.rate.toFixed(1)}%</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${item.rate}%`, backgroundColor: item.color }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top Navigation Bar */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Báo cáo & Phân tích</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                    <Icon name="refresh" size={22} color={COLORS.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Filter controls */}
            <View style={styles.filterSection}>
                <View style={styles.periodFilterWrap}>
                    {[
                        { id: 'last7days', label: '7 ngày qua' },
                        { id: 'last30days', label: '30 ngày qua' },
                        { id: 'thisMonth', label: 'Tháng này' },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.periodBtn, period === item.id && styles.periodBtnActive]}
                            onPress={() => setPeriod(item.id as any)}
                        >
                            <Text style={[styles.periodLabel, period === item.id && styles.periodLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Tab Bar Layout */}
            <View style={styles.tabBar}>
                {[
                    { id: 'overview', label: 'Tổng quan', icon: 'view-dashboard-outline' },
                    { id: 'revenue', label: 'Doanh thu', icon: 'trending-up' },
                    { id: 'products', label: 'Sản phẩm', icon: 'package-variant-closed' },
                    { id: 'orders', label: 'Đơn hàng', icon: 'clipboard-list-outline' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                        onPress={() => setActiveTab(tab.id as any)}
                    >
                        <Icon
                            name={tab.icon}
                            size={18}
                            color={activeTab === tab.id ? '#22c55e' : COLORS.text.muted}
                        />
                        <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text style={styles.loadingText}>Đang tổng hợp báo cáo...</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                    style={styles.scrollContainer}
                >
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'revenue' && renderRevenueTab()}
                    {activeTab === 'products' && renderProductsTab()}
                    {activeTab === 'orders' && renderOrdersTab()}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        height: 56,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.text.primary },
    refreshBtn: { padding: 4 },

    filterSection: {
        paddingVertical: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    periodFilterWrap: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: BORDER_RADIUS.lg,
        padding: 4,
        gap: 4,
    },
    periodBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.md,
    },
    periodBtnActive: {
        backgroundColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    periodLabel: {
        fontSize: FONT_SIZE.xs + 1,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    periodLabelActive: {
        color: '#22c55e',
        fontWeight: '800',
    },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        justifyContent: 'space-around',
    },
    tabItem: {
        alignItems: 'center',
        paddingVertical: 12,
        flex: 1,
        gap: 4,
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: '#22c55e',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.text.muted,
    },
    tabLabelActive: {
        color: '#22c55e',
        fontWeight: '800',
    },

    scrollContainer: { flex: 1, padding: SPACING.md },
    tabContent: { gap: SPACING.md },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: FONT_SIZE.sm, color: COLORS.text.secondary, fontWeight: '600' },

    // Stat Cards
    statsGrid: { flexDirection: 'row', gap: SPACING.md },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    statIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.text.secondary, fontWeight: '600' },
    statVal: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, marginVertical: 4 },
    statSubText: { fontSize: 10, color: COLORS.text.muted, fontWeight: '500' },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    trendText: { fontSize: 10, fontWeight: '700' },

    // Card Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: { marginBottom: SPACING.md },
    cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text.primary },
    cardSubTitle: { fontSize: 10, color: COLORS.text.muted, marginTop: 2, fontWeight: '500' },

    // Svg Charts
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xs,
    },
    emptyChart: {
        height: CHART_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        fontWeight: '600',
    },

    // Stacked Horizontal Bar
    statusSection: { gap: SPACING.md },
    stackedBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    statusDetailsList: { gap: 10 },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    statusName: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.text.secondary },
    statusCount: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.text.primary },

    // Revenue Hero Tab
    revenueHeroCard: {
        backgroundColor: '#8b5cf6',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        alignItems: 'center',
    },
    revenueHeroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase' },
    revenueHeroVal: { color: '#fff', fontSize: 28, fontWeight: '800', marginVertical: 8 },
    revenueHeroFooter: {
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: 12,
        marginTop: 4,
    },
    revenueSubItem: { flex: 1, alignItems: 'center' },
    revenueSubLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500' },
    revenueSubVal: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: 4 },
    dividerVertical: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: '100%' },

    // Table view
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
        marginBottom: 8,
    },
    tableCol: { flex: 1, fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.text.secondary },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
        paddingVertical: 10,
        alignItems: 'center',
    },
    tableCell: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.text.primary },
    emptyRow: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },

    // Top Products Rankings
    productRankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
        gap: SPACING.md,
    },
    rankNumBox: { width: 28, alignItems: 'center' },
    rankNum: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.text.muted },
    topRankNum: { color: '#f59e0b', fontSize: FONT_SIZE.md },
    productImg: { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, objectFit: 'cover', borderWidth: 1, borderColor: '#f1f5f9' },
    productMeta: { flex: 1, gap: 2 },
    productName: { fontSize: FONT_SIZE.xs + 1, fontWeight: '700', color: COLORS.text.primary },
    productCategory: { fontSize: 9, fontWeight: '600', color: COLORS.text.muted, textTransform: 'uppercase' },
    productMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    metricText: { fontSize: 9, color: COLORS.text.secondary },

    // Progress Bar
    progressBarBg: {
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
        marginVertical: 4,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8b5cf6',
        borderRadius: 2.5,
    },

    // Orders Grid
    ordersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    orderStatusCard: {
        width: (SCREEN_WIDTH - 2 * SPACING.md - SPACING.md) / 2 - 2, // 2-column grid layout
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    orderIconBgWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderCardInfo: { flex: 1 },
    orderCardLabel: { fontSize: 10, fontWeight: '600', color: COLORS.text.secondary },
    orderCardVal: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginTop: 2 },

    // Conversion Row
    conversionSection: { gap: 12 },
    convRow: { gap: 4 },
    convMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    convLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.text.secondary },
    convVal: { fontSize: FONT_SIZE.xs, fontWeight: '800' },
});

export default SellerReportsScreen;
