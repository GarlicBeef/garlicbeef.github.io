---
order: 3
title: "Parallel assembly of arbitrary defect-free atom arrays with a multitweezer algorithm"
authors: ["Weikun Tian", "Wen Jun Wee", "An Qu", "Billy Jun Ming Lim", "Prithvi Raj Datla", "Vanessa Pei Wen Koh", "Huanqian Loh"]
year: 2023
venue: "Physical Review Applied 19, 034048"
summary: "A parallel rearrangement algorithm with multiple mobile tweezers assembles defect-free atom arrays of any periodic geometry, demonstrated with 225 atoms."
figure: ../../assets/publications_photos/PhysRevApplied.19.034048-fig1.jpg
figureAlt: "Figure 1 of the paper: optical setup for loading and rearranging Rb atoms with static and mobile tweezers, and a single-shot fluorescence image of a defect-free triangular array of 225 atoms."
doi: "10.1103/PhysRevApplied.19.034048"
preprint: "https://arxiv.org/abs/2209.08038"
zh:
  summary: "一种使用多个可移动光镊的并行重排算法，可组装任意周期构型的无缺陷原子阵列，并以 225 个原子进行了演示。"
  figureAlt: "论文图 1：用静态与可移动光镊装载并重排 Rb 原子的光路，以及 225 个原子组成的无缺陷三角阵列的单次荧光图像。"
  body: "本文提出一种并行重排算法，使用多个可移动光镊对原子阵列进行排序和压缩，同时避免原子之间的碰撞。与单光镊及以往的多光镊方案相比，它所需的移动次数更少；文中还找到了最优的并行度，在加速与光镊之间的不均匀性之间取得平衡。在室温装置中，225 个原子的无缺陷阵列组装成功率最高可达 33(1)%。"
---

The paper presents a parallel rearrangement algorithm that uses multiple mobile tweezers to sort and compress atom
arrays while avoiding collisions between atoms. It needs fewer moves than single-tweezer and earlier multi-tweezer
approaches, and identifies an optimal degree of parallelism that balances speed-up against inhomogeneity between
tweezers. A 225-atom defect-free array is assembled with a probability of up to 33(1)% in a room-temperature setup.
