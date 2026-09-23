export const formatNumber = (val) =>
    val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');