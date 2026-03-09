export function CommentRules() {
    return (
        <div className="rulesContent">
            <h2>CASL2 コメント生成仕様</h2>
            <p>指導書とかに出てくる命令＋<a href="https://www.mlab.im.dendai.ac.jp/~nakajima/proc-ml/instructions/inst-list.html">ここ</a>に載ってる命令に対応しているはず</p>

            <p>もともと自分用にGo言語で作ったやつを移植したやつなのでミスってたらごめんね<br />（チェック通ったCASL2コードのコメントに合わせてますが、実験で使わなかった分はChatG〇Tに考えさせたので正解じゃないかも）</p>

            <p>
                このツールは CASL2 の命令を解析し、命令の意味を説明するコメントを自動生成します。
                入力は次の形式を想定しています。
            </p>
            <pre>
                {`[ラベル]\t命令\tオペランド
または
命令\tオペランド`}
            </pre>

            <p>生成されたコメントは行末に <code>;</code> を付けて追加されます。</p>

            <pre>
                {`LD\tGR1,VALUE
↓
LD\tGR1,VALUE\t;GR1 <- (VALUE)`}
            </pre>

            <h3>定義命令</h3>

            <table className="rulesTable">
                <thead>
                    <tr>
                        <th>命令</th>
                        <th>生成コメント</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>DC</td>
                        <td>{'<label> <- value'}</td>
                    </tr>
                    <tr>
                        <td>DS</td>
                        <td>label {'<-'} n × 128 領域</td>
                    </tr>
                </tbody>
            </table>

            <h3>データ転送命令</h3>

            <table className="rulesTable">
                <thead>
                    <tr>
                        <th>命令</th>
                        <th>生成コメント</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>LD</td>
                        <td>
                            レジスタの場合: r {'<-'} a
                            <br />
                            メモリの場合: r {'<-'} (a + x)
                        </td>
                    </tr>
                    <tr>
                        <td>LAD</td>
                        <td>r {'<-'} a + x</td>
                    </tr>
                    <tr>
                        <td>ST</td>
                        <td>{'<a + x> <- r'}</td>
                    </tr>
                </tbody>
            </table>

            <h3>入出力命令</h3>

            <table className="rulesTable">
                <thead>
                    <tr>
                        <th>命令</th>
                        <th>生成コメント</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>IN</td>
                        <td>INPUT a + x</td>
                    </tr>
                    <tr>
                        <td>OUT</td>
                        <td>OUT a + x</td>
                    </tr>
                </tbody>
            </table>

            <h3>算術命令</h3>

            <table className="rulesTable">
                <thead>
                    <tr>
                        <th>命令</th>
                        <th>生成コメント</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>ADD</td>
                        <td>
                            レジスタ: r {'<-'} r + a
                            <br />
                            メモリ: r {'<-'} r + (a + x)
                        </td>
                    </tr>
                    <tr>
                        <td>SUB</td>
                        <td>
                            レジスタ: r {'<-'} r - a
                            <br />
                            メモリ: r {'<-'} r - (a + x)
                        </td>
                    </tr>
                    <tr>
                        <td>CP</td>
                        <td>
                            レジスタ比較: r : a
                            <br />
                            メモリ比較: |r - (a + x)|
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3>論理演算命令</h3>

            <table className="rulesTable">
                <thead>
                    <tr>
                        <th>命令</th>
                        <th>生成コメント</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>AND</td>
                        <td>
                            レジスタ: r {'<-'} r {'&'} a
                            <br />
                            メモリ: r {'<-'} r {'&'} (a + x)
                        </td>
                    </tr>
                    <tr>
                        <td>OR</td>
                        <td>
                            レジスタ: r {'<-'} r {'|'} a
                            <br />
                            メモリ: r {'<-'} r {'|'} (a + x)
                        </td>
                    </tr>
                    <tr>
                        <td>XOR</td>
                        <td>
                            レジスタ: r {'<-'} r {'^'} a
                            <br />
                            メモリ: r {'<-'} r {'^'} (a + x)
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3>シフト命令</h3>

            <table className="rulesTable">
                <tbody>
                    <tr>
                        <td>SL</td>
                        <td>r {'<-'} r {'<<'} (a + x)</td>
                    </tr>
                    <tr>
                        <td>SR</td>
                        <td>r {'<-'} r {'>>'} (a + x)</td>
                    </tr>
                </tbody>
            </table>

            <h3>分岐命令</h3>

            <table className="rulesTable">
                <tbody>
                    <tr>
                        <td>JMI</td>
                        <td>SF = 1 のとき goto a + x</td>
                    </tr>
                    <tr>
                        <td>JNZ</td>
                        <td>ZF = 0 のとき goto a + x</td>
                    </tr>
                    <tr>
                        <td>JZE</td>
                        <td>ZF = 1 のとき goto a + x</td>
                    </tr>
                    <tr>
                        <td>JPL</td>
                        <td>SF = 0 かつ ZF = 0 のとき goto a + x</td>
                    </tr>
                    <tr>
                        <td>JOV</td>
                        <td>OF = 1 のとき goto a + x</td>
                    </tr>
                    <tr>
                        <td>JUMP</td>
                        <td>goto a + x</td>
                    </tr>
                </tbody>
            </table>

            <h3>スタック操作</h3>

            <table className="rulesTable">
                <tbody>
                    <tr>
                        <td>PUSH</td>
                        <td>
                            SP {'<-'} SP - 1
                            <br />
                            {'<SP> <- a + x'}
                        </td>
                    </tr>
                    <tr>
                        <td>POP</td>
                        <td>
                            (SP) {'->'} r
                            <br />
                            SP {'<-'} SP + 1
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3>制御・その他命令</h3>

            <table className="rulesTable">
                <tbody>
                    <tr>
                        <td>CALL</td>
                        <td>goto a + x</td>
                    </tr>
                    <tr>
                        <td>RET</td>
                        <td>return</td>
                    </tr>
                    <tr>
                        <td>SVC</td>
                        <td>SVC a + x</td>
                    </tr>
                    <tr>
                        <td>NOP</td>
                        <td>No operation</td>
                    </tr>
                </tbody>
            </table>

            <h3>エイリアス命令</h3>
            <p>指導書に出てくる命令優先です。<a href="https://www.mlab.im.dendai.ac.jp/~nakajima/proc-ml/instructions/inst-list.html">ここ</a>に載ってる命令が指導書に載ってない場合はエイリアスに基づいてコメントを付けます。</p>
            <table className="rulesTable">
                <thead>
                    <tr>
                        <th>命令</th>
                        <th>内部処理</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>CPA</td><td>CP</td></tr>
                    <tr><td>CPL</td><td>CP</td></tr>
                    <tr><td>ADDA</td><td>ADD</td></tr>
                    <tr><td>ADDL</td><td>ADD</td></tr>
                    <tr><td>SUBA</td><td>SUB</td></tr>
                    <tr><td>SUBL</td><td>SUB</td></tr>
                    <tr><td>SLA</td><td>SL</td></tr>
                    <tr><td>SLL</td><td>SL</td></tr>
                    <tr><td>SRA</td><td>SR</td></tr>
                    <tr><td>SRL</td><td>SR</td></tr>
                    <tr><td>CALL</td><td>JUMP</td></tr>
                </tbody>
            </table>
        </div>
    )
}