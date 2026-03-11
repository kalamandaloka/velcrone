@php($title = 'Dashboard')
@php($active = 'dashboard')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Dashboard</h1>
            <div class="text-muted small">Ringkasan aktivitas (dummy)</div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-md-3">
            <div class="vc-card card">
                <div class="card-body d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small">Barang</div>
                        <div class="h4 mb-0">765</div>
                    </div>
                    <div class="vc-icon bg-danger-subtle text-danger"><i class="bi bi-box-seam"></i></div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="vc-card card">
                <div class="card-body d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small">Pelanggan</div>
                        <div class="h4 mb-0">765</div>
                    </div>
                    <div class="vc-icon bg-primary-subtle text-primary"><i class="bi bi-people"></i></div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="vc-card card">
                <div class="card-body d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small">Transaksi</div>
                        <div class="h4 mb-0">765</div>
                    </div>
                    <div class="vc-icon bg-warning-subtle text-warning"><i class="bi bi-receipt"></i></div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="vc-card card">
                <div class="card-body d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small">Pendapatan</div>
                        <div class="h4 mb-0">765</div>
                    </div>
                    <div class="vc-icon bg-success-subtle text-success"><i class="bi bi-cash-coin"></i></div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-lg-8">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="fw-semibold">Activity</div>
                        <div class="text-muted small">12 bulan</div>
                    </div>
                    <div style="height: 260px">
                        <canvas id="vcChartActivity"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="fw-semibold">Server Status</div>
                        <div class="text-muted small">Realtime</div>
                    </div>
                    <div style="height: 260px">
                        <canvas id="vcChartServer"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-lg-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="fw-semibold mb-2">User Profile</div>
                    <div class="d-flex align-items-center gap-3">
                        <div style="width: 120px; height: 120px">
                            <canvas id="vcChartProfile"></canvas>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="small text-muted">Complete</div>
                                <div class="small fw-semibold">60%</div>
                            </div>
                            <div class="progress mb-2" style="height: 6px">
                                <div class="progress-bar bg-danger" style="width: 60%"></div>
                            </div>
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="small text-muted">In Progress</div>
                                <div class="small fw-semibold">30%</div>
                            </div>
                            <div class="progress" style="height: 6px">
                                <div class="progress-bar bg-primary" style="width: 30%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="text-muted small mt-3">Dummy: progres aktivitas pengguna</div>
                </div>
            </div>
        </div>
        <div class="col-lg-8">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="fw-semibold">Statistic</div>
                        <div class="text-muted small">This Week vs Last Week</div>
                    </div>
                    <div style="height: 220px">
                        <canvas id="vcChartStatistic"></canvas>
                    </div>
                    <div class="d-flex gap-3 mt-2">
                        <div class="small text-muted">This Week <span class="text-danger fw-semibold ms-1">+4.5%</span></div>
                        <div class="small text-muted">Last Week <span class="text-primary fw-semibold ms-1">+2.5%</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
    <script>
        (function () {
            var activityEl = document.getElementById('vcChartActivity');
            var serverEl = document.getElementById('vcChartServer');
            var profileEl = document.getElementById('vcChartProfile');
            var statisticEl = document.getElementById('vcChartStatistic');

            if (activityEl) {
                new Chart(activityEl, {
                    type: 'bar',
                    data: {
                        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                        datasets: [{
                            label: 'Activity',
                            data: [12, 19, 8, 15, 10, 28, 17, 22, 30, 24, 18, 35],
                            backgroundColor: 'rgba(220,53,69,.65)',
                            borderRadius: 10,
                            maxBarThickness: 36
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false } },
                            y: { grid: { color: 'rgba(0,0,0,.06)' }, ticks: { display: false } }
                        }
                    }
                });
            }

            if (serverEl) {
                new Chart(serverEl, {
                    type: 'bar',
                    data: {
                        labels: ['A','B','C','D','E','F','G','H','I','J','K','L'],
                        datasets: [
                            { label: 'Red', data: [8, 10, 7, 12, 9, 14, 11, 10, 13, 9, 12, 15], backgroundColor: 'rgba(220,53,69,.75)', borderRadius: 6 },
                            { label: 'Blue', data: [6, 8, 5, 9, 7, 11, 8, 7, 10, 6, 9, 12], backgroundColor: 'rgba(13,110,253,.75)', borderRadius: 6 }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { stacked: true, grid: { display: false }, ticks: { display: false } },
                            y: { stacked: true, grid: { color: 'rgba(0,0,0,.06)' }, ticks: { display: false } }
                        }
                    }
                });
            }

            if (profileEl) {
                new Chart(profileEl, {
                    type: 'doughnut',
                    data: {
                        labels: ['Complete', 'In Progress', 'Other'],
                        datasets: [{
                            data: [60, 30, 10],
                            backgroundColor: ['rgba(220,53,69,.85)', 'rgba(13,110,253,.85)', 'rgba(209,213,219,.8)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: { legend: { display: false } }
                    }
                });
            }

            if (statisticEl) {
                new Chart(statisticEl, {
                    type: 'line',
                    data: {
                        labels: ['0','10','20','30','40','50','60','70','80','90','100'],
                        datasets: [
                            { label: 'This Week', data: [12, 18, 15, 20, 16, 22, 19, 24, 18, 14, 10], borderColor: 'rgba(220,53,69,.9)', tension: .4, pointRadius: 0 },
                            { label: 'Last Week', data: [10, 12, 11, 14, 13, 16, 15, 17, 16, 15, 14], borderColor: 'rgba(13,110,253,.9)', tension: .4, pointRadius: 0 }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false } },
                            y: { grid: { color: 'rgba(0,0,0,.06)' }, ticks: { display: false } }
                        }
                    }
                });
            }
        })();
    </script>
@endsection
