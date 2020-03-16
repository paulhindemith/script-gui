Explain my Algebraic System.

Goal v_s = φ(t)

  S = { s_i | i = 0...r }
  F  = { f_i  | i = 0...m }
  FI = { fi_i | i = 0...m }
  M  = { m_(s,f)   | s ∈ S, f  ∈ F  }: s |-> s+1 ∈ S
  MI = { mi_(s,fi) | s ∈ S, fi ∈ FI }: s |-> s-1 ∈ S
  A = M ∪ MI

define:
  ```
  v_s := m_(s,f_is) ⚬ m_(s-1, f_is-1) ⚬ ... ⚬ m_(s0, f_i0), s ∈ S, f_i ∈ F, m_(s,f_i) ∈ M, 0 <= i0...is <= m
  ```
  V = { v_s | s ∈ S }

  T = { t_i | t=0~n } ex. If you want to operate expected, its time calls as `t`, the time which operated before calls as `t-1`
  O = { o_tl | tl ∈ T, o_tl ∈ A, (∀ o_tl = o_tk ∈ MI, ∃ o_ti ∈ M s.t. o_tl ⚬ o_ti = E, (min(tl-tk), tl > ti > tk) || (tl > ti))
  ov_t = o_t ⚬ o_t-1 ⚬ ... ⚬ o_t0, t ∈ T, o_t ∈ O
  OV = { ov_t | t ∈ T }

proposition:
  ```
  ∀ t ∈ T, ∀ ov_t ∈ OV, ∃ v_s ∈ V s.t. v_s = ov_t - (1)
  ```

  ∀ t-1, t ∈ T, ∃ o_t ∈ O s.t. ov_t = o_t ⚬ ov_t-1
  ∀ s-1, s ∈ S, ∀ f ∈ F, ∃ m_(s,f) ∈ M s.t. v_s = m_(s,f) ⚬ v_s-1
  ∀ s, s+1 ∈ S, ∃ fi ∈ FI, ∃ mi_(s,fi) ∈ MI s.t. v_s = mi_(s,fi) ⚬ v_s+1, mi_(s,fi) ⚬ m_(s+1,f) = E, v_s+1 = m_(s+1,f) ⚬ v_s

(1) <=>
	1. ∀ s-1, s ∈ S, ∀ t-1, t ∈ T, ∀ f ∈ F, ∃ o_t ∈ O, ∃ m_(s,f) ∈ M s.t. o_t ⚬ ov_t-1 = m_(s,f) ⚬ v_s-1
	2. ∀ s, s+1 ∈ S, ∀ t-1, t ∈ T, ∀ f ∈ F, ∃ mi_(s,fi) ∈ MI, ∃ o_t ∈ O s.t. o_t ⚬ ov_t-1 = mi_(s,fi) ⚬ v_s+1, mi_(s,fi) ⚬ m_(s+1,f) = E, v_s+1 = m_(s+1,f) ⚬ v_s

  1: v_s-1 = ov_t-1, 2: v_s+1 = ov_t-1
∴ (1) <=>
	1. ∀ s-1, s ∈ S, ∀ t-1, t ∈ T, ∀ f ∈ F, ∃ o_t ∈ V s.t. o_t = m_(s,f), v_s-1 = ov_t-1 - (2)
  2. ∀ s, s+1 ∈ S, ∀ t-1, t ∈ T, ∃ mi_(s,fi) ∈ MI, ∃ o_t ∈ O s.t. o_t = mi_(s,fi), v_s+1 = mi_(s,fi)^-1 ⚬ v_s, v_s+1 = ov_t-1 - (3)

  (2) = apply
  (3) = cancel

functions
  ∀ s-1, s ∈ S -> forAllPreSAndS(s)
  ∀ s, s+1 ∈ S -> forAllSAndPostS(s)
  ∀ f ∈ F -> forAllF(f)
  o_t = m_(s,f) -> IsMappingFDefined(s, f)
  v_s-1 = ov_t-1 -> isLastView(s-1) if view is defined, operation is completed at current time (t-1)
  o_t = m_(s, fi) -> IsMappingFIDefined(s, fi)
  v_s+1 = mi_(s,fi)^-1 ⚬ v_s -> IsLastMappingOfView(s+1, inverseOfFI(s, fi))
  v_s+1 = ov_t-1 -> isLastView(s+1)
